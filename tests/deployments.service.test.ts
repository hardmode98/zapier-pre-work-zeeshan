import { describe, expect, it } from 'vitest';
import { NotFoundError } from '../src/errors/app-error';
import {
  createDeployment,
  getDeploymentById,
  listDeployments,
} from '../src/modules/deployments/deployments.service';
import { deploymentsSeed } from '../src/seed/deployments.seed';

/**
 * Service tests run against the in-memory MongoDB seeded by tests/setup.ts, so
 * they exercise the real Mongoose query path (no mocks).
 */
describe('deployments service', () => {
  it('lists all deployments when no filter is applied', async () => {
    const all = await listDeployments({});
    expect(all).toHaveLength(deploymentsSeed.length);
  });

  it('filters by service and status together', async () => {
    const results = await listDeployments({ service: 'billing-api', status: 'failed' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((d) => d.service === 'billing-api' && d.status === 'failed')).toBe(true);
  });

  it('returns an empty array for a valid filter that matches nothing', async () => {
    expect(await listDeployments({ service: 'does-not-exist' })).toEqual([]);
  });

  it('returns a single deployment by its Mongo _id', async () => {
    const [first] = await listDeployments({});
    const found = await getDeploymentById(String(first!._id));
    expect(found._id.toString()).toBe(first!._id.toString());
    expect(found.service).toBe(first!.service);
  });

  it('throws NotFoundError for a well-formed but unknown id', async () => {
    await expect(getDeploymentById('64b7f9f9f9f9f9f9f9f9f9f9')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError for a malformed id', async () => {
    await expect(getDeploymentById('not-an-object-id')).rejects.toThrow(NotFoundError);
  });

  it('creates (ingests) a new deployment', async () => {
    const created = await createDeployment({
      service: 'payments-api',
      status: 'success',
      duration: 120,
      timestamp: '2025-05-10T10:00:00Z',
      commit_sha: 'abc1234',
    });
    expect(created._id).toBeDefined();
    expect(await listDeployments({})).toHaveLength(deploymentsSeed.length + 1);
  });
});
