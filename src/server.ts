import 'dotenv/config';
import type { Server } from 'node:http';
import { createApp } from './app';
import { connectToDatabase, disconnectFromDatabase } from './db/mongoose';
import { seedIfEmpty } from './seed/seed';

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/**
 * Process entrypoint: connect to the database, seed it, build the app, start the
 * HTTP server, and install process-level safety nets (unhandled rejections,
 * uncaught exceptions, and graceful shutdown on signals).
 */
async function start(): Promise<void> {
  await connectToDatabase();
  await seedIfEmpty();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(
      `[server] listening on http://localhost:${PORT} (env=${NODE_ENV})`,
    );
  });


  server.on('error', (err) => {
    console.error('[server] failed to bind:', err);
    process.exit(1);
  });

  installProcessHandlers(server);
}

/**
 * A rejected promise or thrown error with no handler leaves the process in an
 * undefined state. Log it, then shut the server down cleanly and exit non-zero so
 * an orchestrator can restart us from a known-good state.
 */
function installProcessHandlers(server: Server): void {
  const shutdown = (signal: string, code: number): void => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectFromDatabase();
      console.log('[server] closed remaining connections, exiting');
      process.exit(code);
    });
    // Failsafe: don't hang forever if connections refuse to drain. (This is a
    // last-resort timeout, not an immediate poison pill — see the README.)
    setTimeout(() => process.exit(code), 10_000).unref();
  };

  process.on('unhandledRejection', (reason) => {
    console.error('[server] unhandled promise rejection:', reason);
    shutdown('unhandledRejection', 1);
  });

  process.on('uncaughtException', (err) => {
    console.error('[server] uncaught exception:', err);
    shutdown('uncaughtException', 1);
  });

  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
