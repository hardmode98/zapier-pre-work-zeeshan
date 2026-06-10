/**
 * Shared domain constants for the deployments module.
 *
 * The set of valid statuses lives here because it is reused in two places: the
 * Mongoose schema `enum` (DB-level validation) and the zod schemas (request-level
 * validation). The document shape itself is defined by the Mongoose schema (see
 * `deployment.model.ts`), and request shapes by the zod schemas.
 */

/** Lifecycle state of a deployment. */
export const DEPLOYMENT_STATUSES = [
  'success',
  'failed',
  'in_progress',
  'rolled_back',
  'pending',
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];
