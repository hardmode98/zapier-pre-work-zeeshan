import { z } from 'zod';
import { DEPLOYMENT_STATUSES } from './deployment.types';

/**
 * Request-boundary validation (zod). This is the first of two validation layers —
 * the Mongoose schema validates again at the DB. Keeping them separate means
 * malformed requests are rejected with a clear 400 before they ever touch Mongo.
 */

/** Body accepted by `POST /deployments`. The `_id` is assigned by MongoDB. */
export const createDeploymentSchema = z.object({
  service: z.string().trim().min(1, 'service must not be empty'),
  status: z.enum(DEPLOYMENT_STATUSES),
  duration: z.number().nonnegative('duration must be >= 0'),
  timestamp: z.iso.datetime({ message: 'timestamp must be an ISO-8601 date-time' }),
  commit_sha: z.string().trim().min(1, 'commit_sha must not be empty'),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;

/** Validated, normalized filters accepted by the list endpoint. */
export const listQuerySchema = z.object({
  service: z.string().trim().min(1, 'service must not be empty').optional(),
  status: z.enum(DEPLOYMENT_STATUSES).optional(),
});

export type DeploymentQueryInput = z.infer<typeof listQuerySchema>;
