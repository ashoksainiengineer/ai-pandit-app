import { db, executeWithRetry } from '@ai-pandit/db';
import { artifacts } from '@ai-pandit/db/schema';
import { eq, lt } from 'drizzle-orm';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { deleteArtifactObject } from '../lib/jobs/artifact-storage.js';

function getArgValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const limit = Number.parseInt(getArgValue('--limit') ?? '100', 10);
  const retentionDays = Number.parseInt(
    getArgValue('--retention-days') ?? String(config.storage.artifactRetentionDays),
    10
  );

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const staleArtifacts = await executeWithRetry(() =>
    db
      .select({
        id: artifacts.id,
        uri: artifacts.uri,
        createdAt: artifacts.createdAt,
      })
      .from(artifacts)
      .where(lt(artifacts.createdAt, cutoff))
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 100)
  );

  logger.info('Artifact cleanup scan completed', {
    cutoff,
    retentionDays,
    dryRun,
    candidates: staleArtifacts.length,
  });

  if (dryRun || staleArtifacts.length === 0) {
    return;
  }

  for (const artifact of staleArtifacts) {
    try {
      await deleteArtifactObject(artifact.uri);
      await executeWithRetry(() => db.delete(artifacts).where(eq(artifacts.id, artifact.id)));
      logger.info('Deleted stale artifact reference', {
        artifactId: artifact.id,
        uri: artifact.uri,
      });
    } catch (error) {
      logger.error('Failed to delete stale artifact', {
        artifactId: artifact.id,
        uri: artifact.uri,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

main().catch((error) => {
  logger.error('Artifact cleanup script failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
