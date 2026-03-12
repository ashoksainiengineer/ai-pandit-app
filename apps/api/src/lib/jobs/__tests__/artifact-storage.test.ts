import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createArtifactMock,
  loggerErrorMock,
  saveMock,
  deleteMock,
  fileMock,
  bucketMock,
  storageCtorMock,
} = vi.hoisted(() => {
  const save = vi.fn();
  const del = vi.fn();
  const file = vi.fn(() => ({ save, delete: del }));
  const bucket = vi.fn(() => ({ file }));
  const storageCtor = vi.fn(function StorageMock() {
    return { bucket };
  });

  return {
    createArtifactMock: vi.fn(),
    loggerErrorMock: vi.fn(),
    saveMock: save,
    deleteMock: del,
    fileMock: file,
    bucketMock: bucket,
    storageCtorMock: storageCtor,
  };
});

vi.mock('@ai-pandit/db/jobs', () => ({
  createArtifact: createArtifactMock,
}));

vi.mock('../../../config/index.js', () => ({
  config: {
    storage: {
      artifactPrefix: 'analysis-artifacts',
      gcsBucket: undefined as string | undefined,
    },
  },
}));

vi.mock('../../logger.js', () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: storageCtorMock,
}));

import { config } from '../../../config/index.js';
import {
  deleteArtifactObject,
  parseGcsUri,
  persistArtifactReference,
} from '../artifact-storage.js';

describe('artifact-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.storage.gcsBucket = undefined;
  });

  it('persists fallback artifact metadata when GCS bucket is not configured', async () => {
    await persistArtifactReference({
      jobId: 'job-1',
      kind: 'report',
      fileName: 'summary final.json',
      mimeType: 'application/json',
      payload: '{"ok":true}',
      metadata: { stage: 'final' },
    });

    expect(createArtifactMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-1',
        kind: 'report',
        uri: 'artifact://job-1/report/summary_final.json',
        mimeType: 'application/json',
        metadataJson: expect.objectContaining({
          storageBackend: 'fallback',
          objectPath: 'analysis-artifacts/job-1/report/summary_final.json',
          stage: 'final',
        }),
      })
    );

    expect(storageCtorMock).not.toHaveBeenCalled();
  });

  it('uploads to GCS and persists gs:// URI when bucket is configured', async () => {
    config.storage.gcsBucket = 'ai-pandit-artifacts';
    saveMock.mockResolvedValueOnce(undefined);

    await persistArtifactReference({
      jobId: 'job-2',
      kind: 'analysis_result',
      fileName: 'result.json',
      mimeType: 'application/json',
      payload: '{"score":99}',
    });

    expect(storageCtorMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(createArtifactMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'gs://ai-pandit-artifacts/analysis-artifacts/job-2/analysis_result/result.json',
        metadataJson: expect.objectContaining({ storageBackend: 'gcs' }),
      })
    );
  });

  it('falls back to metadata-only URI when GCS upload throws', async () => {
    config.storage.gcsBucket = 'ai-pandit-artifacts';
    saveMock.mockRejectedValueOnce(new Error('upload failed'));

    await persistArtifactReference({
      jobId: 'job-3',
      kind: 'dead_letter_report',
      fileName: 'dlq.txt',
      mimeType: 'text/plain',
      payload: 'dead letter',
    });

    expect(loggerErrorMock).toHaveBeenCalled();
    expect(createArtifactMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: 'artifact://job-3/dead_letter_report/dlq.txt',
        metadataJson: expect.objectContaining({ storageBackend: 'fallback' }),
      })
    );
  });

  it('parses valid gs:// URI and rejects invalid URIs', () => {
    expect(parseGcsUri('gs://bucket-a/path/to/object.json')).toEqual({
      bucket: 'bucket-a',
      objectPath: 'path/to/object.json',
    });

    expect(parseGcsUri('artifact://job-1/report/file.json')).toBeNull();
    expect(parseGcsUri('gs://bucket-only')).toBeNull();
  });

  it('deleteArtifactObject no-ops for non-gcs URI and deletes with ignoreNotFound for gs://', async () => {
    await deleteArtifactObject('artifact://job-1/report/file.txt');
    expect(storageCtorMock).not.toHaveBeenCalled();

    await deleteArtifactObject('gs://bucket-x/foo/bar.txt');

    expect(storageCtorMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith({ ignoreNotFound: true });
  });
});
