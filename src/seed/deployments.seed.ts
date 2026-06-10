import type { CreateDeploymentInput } from '../modules/deployments/deployments.schema';

/**
 * Mock deployment events used to seed the in-memory MongoDB at startup.
 *
 * Each record is a valid create payload (no `id` — MongoDB assigns `_id` on
 * insert). Spread deliberately across five services, all five statuses, a range of
 * durations, and timestamps spanning several weeks so the list/filter endpoints
 * have realistic data to work with.
 */
export const deploymentsSeed: CreateDeploymentInput[] = [
  { service: 'billing-api', status: 'success', duration: 142, timestamp: '2025-04-01T09:12:00Z', commit_sha: 'a1b2c3d' },
  { service: 'billing-api', status: 'failed', duration: 320, timestamp: '2025-04-03T14:32:00Z', commit_sha: 'b2c3d4e' },
  { service: 'billing-api', status: 'success', duration: 138, timestamp: '2025-04-06T11:05:00Z', commit_sha: 'c3d4e5f' },
  { service: 'billing-api', status: 'rolled_back', duration: 410, timestamp: '2025-04-09T16:48:00Z', commit_sha: 'd4e5f6a' },
  { service: 'billing-api', status: 'success', duration: 151, timestamp: '2025-04-14T08:20:00Z', commit_sha: 'e5f6a7b' },
  { service: 'billing-api', status: 'in_progress', duration: 0, timestamp: '2025-04-28T14:32:00Z', commit_sha: 'f6a7b8c' },

  { service: 'auth-service', status: 'success', duration: 88, timestamp: '2025-04-02T10:00:00Z', commit_sha: '1a2b3c4' },
  { service: 'auth-service', status: 'success', duration: 92, timestamp: '2025-04-05T13:15:00Z', commit_sha: '2b3c4d5' },
  { service: 'auth-service', status: 'failed', duration: 205, timestamp: '2025-04-08T19:40:00Z', commit_sha: '3c4d5e6' },
  { service: 'auth-service', status: 'success', duration: 79, timestamp: '2025-04-12T07:55:00Z', commit_sha: '4d5e6f7' },
  { service: 'auth-service', status: 'pending', duration: 0, timestamp: '2025-04-27T22:10:00Z', commit_sha: '5e6f7a8' },
  { service: 'auth-service', status: 'success', duration: 101, timestamp: '2025-04-29T09:30:00Z', commit_sha: '6f7a8b9' },

  { service: 'web-frontend', status: 'success', duration: 64, timestamp: '2025-04-01T12:00:00Z', commit_sha: 'aa11bb2' },
  { service: 'web-frontend', status: 'success', duration: 71, timestamp: '2025-04-04T15:25:00Z', commit_sha: 'bb22cc3' },
  { service: 'web-frontend', status: 'failed', duration: 188, timestamp: '2025-04-07T18:10:00Z', commit_sha: 'cc33dd4' },
  { service: 'web-frontend', status: 'rolled_back', duration: 240, timestamp: '2025-04-10T20:45:00Z', commit_sha: 'dd44ee5' },
  { service: 'web-frontend', status: 'success', duration: 68, timestamp: '2025-04-18T06:35:00Z', commit_sha: 'ee55ff6' },
  { service: 'web-frontend', status: 'success', duration: 73, timestamp: '2025-04-25T11:50:00Z', commit_sha: 'ff66aa7' },
  { service: 'web-frontend', status: 'in_progress', duration: 0, timestamp: '2025-04-30T13:05:00Z', commit_sha: 'aa77bb8' },

  { service: 'notifications-worker', status: 'success', duration: 115, timestamp: '2025-04-02T08:45:00Z', commit_sha: '9c8d7e6' },
  { service: 'notifications-worker', status: 'failed', duration: 277, timestamp: '2025-04-05T17:20:00Z', commit_sha: '8d7e6f5' },
  { service: 'notifications-worker', status: 'failed', duration: 301, timestamp: '2025-04-11T21:00:00Z', commit_sha: '7e6f5a4' },
  { service: 'notifications-worker', status: 'success', duration: 109, timestamp: '2025-04-16T09:15:00Z', commit_sha: '6f5a4b3' },
  { service: 'notifications-worker', status: 'success', duration: 122, timestamp: '2025-04-22T14:40:00Z', commit_sha: '5a4b3c2' },
  { service: 'notifications-worker', status: 'pending', duration: 0, timestamp: '2025-04-28T23:55:00Z', commit_sha: '4b3c2d1' },

  { service: 'search-api', status: 'success', duration: 196, timestamp: '2025-04-03T10:30:00Z', commit_sha: 'c0ffee1' },
  { service: 'search-api', status: 'success', duration: 203, timestamp: '2025-04-06T12:10:00Z', commit_sha: 'c0ffee2' },
  { service: 'search-api', status: 'failed', duration: 540, timestamp: '2025-04-09T15:00:00Z', commit_sha: 'c0ffee3' },
  { service: 'search-api', status: 'success', duration: 188, timestamp: '2025-04-13T08:05:00Z', commit_sha: 'c0ffee4' },
  { service: 'search-api', status: 'rolled_back', duration: 612, timestamp: '2025-04-17T19:25:00Z', commit_sha: 'c0ffee5' },
  { service: 'search-api', status: 'success', duration: 210, timestamp: '2025-04-21T07:45:00Z', commit_sha: 'c0ffee6' },
  { service: 'search-api', status: 'success', duration: 199, timestamp: '2025-04-26T16:30:00Z', commit_sha: 'c0ffee7' },
  { service: 'search-api', status: 'in_progress', duration: 0, timestamp: '2025-04-30T18:00:00Z', commit_sha: 'c0ffee8' },

  { service: 'billing-api', status: 'success', duration: 134, timestamp: '2025-05-02T09:00:00Z', commit_sha: 'abc1234' },
  { service: 'auth-service', status: 'failed', duration: 198, timestamp: '2025-05-03T11:20:00Z', commit_sha: 'def5678' },
  { service: 'search-api', status: 'success', duration: 205, timestamp: '2025-05-04T13:40:00Z', commit_sha: 'ghi9012' },
];
