import mongoose from 'mongoose';
import { NotFoundError } from '../../errors/app-error';
import { DeploymentModel } from './deployment.model';
import type { CreateDeploymentInput, DeploymentQueryInput } from './deployments.schema';

/**
 * Deployment business logic — plain functions over the Mongoose model. No class,
 * no dependency injection: the model already wraps the single shared connection,
 * so callers just import these. Knows nothing about HTTP (req/res).
 */

/** Map validated query params to a Mongo filter (pure — unit-testable). */
export function buildDeploymentFilter(query: DeploymentQueryInput): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (query.service !== undefined) filter.service = query.service;
  if (query.status !== undefined) filter.status = query.status;
  return filter;
}

/** List deployments matching an already-validated query. */
export async function listDeployments(query: DeploymentQueryInput) {
  return DeploymentModel.find(buildDeploymentFilter(query)).lean();
}

/** Fetch one deployment by id, throwing a 404 if it is missing or malformed. */
export async function getDeploymentById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new NotFoundError(`Deployment '${id}' not found`);
  }
  const deployment = await DeploymentModel.findById(id).lean();
  if (!deployment) {
    throw new NotFoundError(`Deployment '${id}' not found`);
  }
  return deployment;
}

/** Ingest a new deployment. Mongoose schema validation runs on create. */
export async function createDeployment(input: CreateDeploymentInput) {
  return DeploymentModel.create(input);
}

