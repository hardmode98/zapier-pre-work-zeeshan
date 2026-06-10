import { type InferSchemaType, model, Schema } from 'mongoose';
import { DEPLOYMENT_STATUSES } from './deployment.types';

/**
 * Mongoose schema for a deployment event — the single source of truth for the
 * document shape and DB-level validation (required fields, the status enum, a
 * non-negative duration).
 *
 * Kept deliberately plain: no custom `toJSON`/transform, so documents carry
 * Mongoose's default `_id` (the identifier), and the API serializes them as-is.
 * `versionKey: false` drops the internal `__v` counter — the API never exposes
 * concurrent-update semantics, so it was noise on the wire. `timestamp` is a
 * `Date` (Mongoose casts the incoming ISO-8601 string), and `res.json`
 * serializes it back to an ISO string.
 */
const deploymentSchema = new Schema(
  {
    service: { type: String, required: true },
    status: { type: String, required: true, enum: [...DEPLOYMENT_STATUSES] },
    duration: { type: Number, required: true, min: 0 },
    timestamp: { type: Date, required: true },
    commit_sha: { type: String, required: true },
  },
  { versionKey: false },
);

/** Stored document shape inferred from the schema (excludes `_id`). */
export type DeploymentDocument = InferSchemaType<typeof deploymentSchema>;

export const DeploymentModel = model('Deployment', deploymentSchema);
