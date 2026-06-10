import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

/**
 * End-to-end HTTP tests via supertest — exercises routing, validation, the
 * response envelope, and the custom 404 / error handler without binding a port.
 * The app uses the in-memory MongoDB connected and seeded by tests/setup.ts.
 */
describe('Deployments API', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /deployments returns the full list in the standard envelope', async () => {
    const res = await request(app).get('/deployments');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.message).toBe('string');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(30);
    expect(res.body.meta.count).toBe(res.body.data.length);
  });

  it('filters by status and service', async () => {
    const res = await request(app)
      .get('/deployments')
      .query({ status: 'failed', service: 'billing-api' });
    expect(res.status).toBe(200);
    expect(res.body.data.every((d: { service: string; status: string }) =>
      d.service === 'billing-api' && d.status === 'failed',
    )).toBe(true);
    expect(res.body.meta.filters).toEqual({ service: 'billing-api', status: 'failed' });
  });

  it('returns 400 with a message for an invalid status', async () => {
    const res = await request(app).get('/deployments').query({ status: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.message).toBe('string');
  });

  it('GET /deployments/:id returns a single deployment', async () => {
    const list = await request(app).get('/deployments');
    const { _id, service } = list.body.data[0];
    const res = await request(app).get(`/deployments/${_id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(_id);
    expect(res.body.data.service).toBe(service);
  });

  it('returns a 404 envelope for an unknown deployment id', async () => {
    const res = await request(app).get('/deployments/64b7f9f9f9f9f9f9f9f9f9f9');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns a custom 404 for an unknown route', async () => {
    const res = await request(app).get('/totally/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.message).toContain('/totally/unknown');
  });

  it('POST /deployments ingests a new deployment', async () => {
    const res = await request(app).post('/deployments').send({
      service: 'payments-api',
      status: 'success',
      duration: 95,
      timestamp: '2025-05-11T12:00:00Z',
      commit_sha: 'def5678',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.service).toBe('payments-api');
  });

  it('POST /deployments returns 400 for an invalid body', async () => {
    const res = await request(app).post('/deployments').send({
      service: 'payments-api',
      status: 'bogus',
      duration: -1,
      timestamp: 'not-a-date',
      commit_sha: '',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exposes a health check with db status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.db).toBe('up');
  });
});
