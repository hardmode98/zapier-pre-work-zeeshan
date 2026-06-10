import { DeploymentModel } from '../modules/deployments/deployment.model';
import { deploymentsSeed } from './deployments.seed';

/**
 * Seed the mock deployment events into MongoDB, but only when the collection is
 * empty. Idempotent: safe to call on every startup. With the in-memory database
 * this effectively re-seeds on each run (the store is ephemeral).
 */
export async function seedIfEmpty(): Promise<void> {
  const count = await DeploymentModel.estimatedDocumentCount();
  if (count > 0) {
    console.log(`[seed] skipped — ${count} deployments already present`);
    return;
  }

  await DeploymentModel.insertMany(deploymentsSeed);
  console.log(`[seed] seeded ${deploymentsSeed.length} deployments`);
}
