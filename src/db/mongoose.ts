import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Database connection setup.
 *
 * The service runs against an ephemeral in-memory MongoDB (via
 * `mongodb-memory-server`), so it needs zero external setup — no Mongo install, no
 * Docker, no connection string. Data lives for the process lifetime and is
 * re-seeded on each start.
 *
 * This module is the only place that knows about the in-memory server. Everywhere
 * else just imports the Mongoose models, which use the single global connection.
 */
let memoryServer: MongoMemoryServer | undefined;

export async function connectToDatabase(): Promise<void> {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  console.log('[db] connected to in-memory MongoDB');
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}
