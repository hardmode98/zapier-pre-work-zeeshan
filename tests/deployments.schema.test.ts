import { describe, expect, it } from 'vitest';
import {
  createDeploymentSchema,
  listQuerySchema,
} from '../src/modules/deployments/deployments.schema';

const validBody = {
  service: 'billing-api',
  status: 'success',
  duration: 120,
  timestamp: '2025-05-01T10:00:00Z',
  commit_sha: 'abc1234',
};

describe('createDeploymentSchema', () => {
  it('accepts a valid payload and normalizes whitespace', () => {
    expect(
      createDeploymentSchema.parse({ ...validBody, service: '  billing-api  ' }),
    ).toEqual(validBody);
  });

  it('rejects an invalid status', () => {
    expect(() => createDeploymentSchema.parse({ ...validBody, status: 'bogus' })).toThrow();
  });

  it('rejects a missing required field', () => {
    const { commit_sha, ...withoutSha } = validBody;
    expect(() => createDeploymentSchema.parse(withoutSha)).toThrow();
  });

  it('rejects a negative duration', () => {
    expect(() => createDeploymentSchema.parse({ ...validBody, duration: -5 })).toThrow();
  });

  it('rejects a malformed timestamp', () => {
    expect(() => createDeploymentSchema.parse({ ...validBody, timestamp: 'not-a-date' })).toThrow();
  });
});

describe('listQuerySchema', () => {
  it('accepts valid filters', () => {
    expect(listQuerySchema.parse({ service: 'billing-api', status: 'failed' })).toEqual({
      service: 'billing-api',
      status: 'failed',
    });
  });

  it('accepts an empty query', () => {
    expect(listQuerySchema.parse({})).toEqual({});
  });

  it('rejects an invalid status', () => {
    expect(() => listQuerySchema.parse({ status: 'bogus' })).toThrow();
  });

  it('rejects an empty/whitespace service', () => {
    expect(() => listQuerySchema.parse({ service: '   ' })).toThrow();
  });
});
