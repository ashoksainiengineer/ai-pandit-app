import crypto from 'node:crypto';
import { createArtifact } from '@ai-pandit/db/jobs';
import type { ArtifactKind } from '@ai-pandit/db/schema';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

interface PersistArtifactInput {
  jobId: string;
  sessionId?: string | null;
  kind: ArtifactKind;
  fileName: string;
  mimeType: string;
  payload: string | Buffer;
  metadata?: Record<string, unknown>;
}

type StorageClientModule = typeof import('@google-cloud/storage');

let storageModulePromise: Promise<StorageClientModule> | null = null;

function getStorageModule(): Promise<StorageClientModule> {
  storageModulePromise ??= import('@google-cloud/storage');
  return storageModulePromise;
}

function toBuffer(payload: string | Buffer): Buffer {
  return Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
}

function buildObjectPath(jobId: string, kind: ArtifactKind, fileName: string): string {
  const normalizedFileName = fileName.replace(/[^A-Za-z0-9._-]/g, '_');
  return `${config.storage.artifactPrefix}/${jobId}/${kind}/${normalizedFileName}`;
}

async function uploadToGcs(
  objectPath: string,
  payload: Buffer,
  mimeType: string
): Promise<string> {
  const bucketName = config.storage.gcsBucket;
  if (!bucketName) {
    throw new Error('GCS bucket is not configured');
  }

  const { Storage } = await getStorageModule();
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);

  await file.save(payload, {
    resumable: false,
    contentType: mimeType,
    metadata: {
      cacheControl: 'private, max-age=0, no-store',
    },
  });

  return `gs://${bucketName}/${objectPath}`;
}

function buildFallbackUri(jobId: string, kind: ArtifactKind, fileName: string): string {
  return `artifact://${jobId}/${kind}/${fileName.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

export async function persistArtifactReference(input: PersistArtifactInput): Promise<void> {
  const payloadBuffer = toBuffer(input.payload);
  const checksum = crypto.createHash('sha256').update(payloadBuffer).digest('hex');
  const objectPath = buildObjectPath(input.jobId, input.kind, input.fileName);

  let uri = buildFallbackUri(input.jobId, input.kind, input.fileName);
  let storageBackend: 'gcs' | 'fallback' = 'fallback';

  if (config.storage.gcsBucket) {
    try {
      uri = await uploadToGcs(objectPath, payloadBuffer, input.mimeType);
      storageBackend = 'gcs';
    } catch (error) {
      logger.error('Artifact upload failed, falling back to metadata-only reference', {
        jobId: input.jobId,
        kind: input.kind,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await createArtifact({
    id: crypto.randomUUID(),
    jobId: input.jobId,
    sessionId: input.sessionId ?? null,
    kind: input.kind,
    uri,
    mimeType: input.mimeType,
    checksum,
    sizeBytes: payloadBuffer.byteLength,
    metadataJson: {
      storageBackend,
      objectPath,
      ...input.metadata,
    },
  });
}

export function parseGcsUri(uri: string): { bucket: string; objectPath: string } | null {
  if (!uri.startsWith('gs://')) {
    return null;
  }

  const [, , bucketAndPath] = uri.split('/');
  if (!bucketAndPath) {
    return null;
  }

  const bucket = bucketAndPath;
  const objectPath = uri.slice(`gs://${bucket}/`.length);
  if (!objectPath) {
    return null;
  }

  return { bucket, objectPath };
}

export async function deleteArtifactObject(uri: string): Promise<void> {
  const parsed = parseGcsUri(uri);
  if (!parsed) {
    return;
  }

  const { Storage } = await getStorageModule();
  const storage = new Storage();
  await storage.bucket(parsed.bucket).file(parsed.objectPath).delete({ ignoreNotFound: true });
}
