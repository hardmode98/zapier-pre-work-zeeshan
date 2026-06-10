import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { DeploymentModel } from '../src/modules/deployments/deployment.model';
import { deploymentsSeed } from '../src/seed/deployments.seed';

/**
 * Per-file test database. Starts an ephemeral MongoDB, connects Mongoose, and
 * re-seeds the known fixture before every test so each starts from a clean,
 * predictable state. Mirrors how the app itself runs (in-memory Mongo), so the
 * service and API tests exercise the real data path.
 */
let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
});

beforeEach(async () => {
  await DeploymentModel.deleteMany({});
  await DeploymentModel.insertMany(deploymentsSeed);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});
