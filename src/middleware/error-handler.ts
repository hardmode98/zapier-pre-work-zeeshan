import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { fail } from '../http/response';

interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
  /** Operational = a deliberate client-facing failure; we don't log these as crashes. */
  operational: boolean;
}

/**
 * Normalize any thrown value into a client-facing shape. Two validation layers
 * feed in here: `ZodError` (request boundary) and Mongoose's `ValidationError`
 * (DB layer) — both become a `400 VALIDATION_ERROR` with field-level details.
 * `AppError`s map to their own status/code. Anything else is an unexpected 500.
 */
function normalize(err: unknown): NormalizedError {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details, operational: true };
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    return { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details, operational: true };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Document validation failed', details, operational: true };
  }

  return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: undefined, operational: false };
}

/**
 * Global error handler — the last middleware in the stack.
 *
 * Operational failures (AppError / Zod / Mongoose validation) map to their
 * status/code/message. Everything else is unexpected: respond with a generic 500
 * (never leak internal messages) while always logging the real error server-side.
 * The stack trace is included in the response body only outside production.
 *
 * Express identifies this as an error handler by its four-argument signature, so
 * `next` must stay in the list even though it is unused.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const { statusCode, code, message, details, operational } = normalize(err);

  // Unexpected failures are logged in full for observability.
  if (!operational) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const stack = !isProduction && err instanceof Error ? err.stack : undefined;

  res.status(statusCode).json(fail(message, code, details, stack));
};
