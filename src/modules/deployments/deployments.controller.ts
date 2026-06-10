import { ok } from '../../http/response';
import { asyncHandler } from '../../middleware/async-handler';
import { createDeploymentSchema, listQuerySchema } from './deployments.schema';
import { createDeployment, getDeploymentById, listDeployments } from './deployments.service';

/**
 * HTTP handlers for deployments — plain functions (no class, no `this`). Each is
 * wrapped in `asyncHandler` so a rejected promise (e.g. a thrown `ZodError` or
 * `NotFoundError`) reaches the global error handler. Handlers hold no business
 * logic: validate input, call the service, shape the response envelope.
 */

export const list = asyncHandler(async (req, res) => {
  const query = listQuerySchema.parse(req.query);
  const deployments = await listDeployments(query);

  res.status(200).json(
    ok(deployments, 'Deployments retrieved', {
      count: deployments.length,
      filters: {
        service: query.service ?? null,
        status: query.status ?? null,
      },
    }),
  );
});

export const getById = asyncHandler(async (req, res) => {
  const deployment = await getDeploymentById(req.params.id as string);
  res.status(200).json(ok(deployment, 'Deployment retrieved'));
});

export const create = asyncHandler(async (req, res) => {
  const input = createDeploymentSchema.parse(req.body);
  const deployment = await createDeployment(input);
  res.status(201).json(ok(deployment, 'Deployment created'));
});
