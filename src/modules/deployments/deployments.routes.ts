import { Router } from 'express';
import { create, getById, list } from './deployments.controller';

/**
 * Deployments router — plain handlers mounted on a Router. No factory and no
 * injected dependencies: the handlers reach the Mongoose model directly.
 */
export const deploymentsRouter = Router();

deploymentsRouter.get('/', list);
deploymentsRouter.post('/', create);
deploymentsRouter.get('/:id', getById);
