import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generationStep } from './generation-step.ts';

test('moves through observed backend milestones without a simulated timer', () => {
  const lines = [
    '[2026-10-24T01:35:39.941Z] Preparing Next.js workspace',
    '[2026-10-24T01:35:39.943Z] Deployment status: not started; waiting for generation and build to finish',
    '[2026-10-24T01:36:23.499Z] Docker application build passed',
    '[2026-10-24T01:36:24.499Z] Deployment status: queued for Dokploy',
  ];
  assert.equal(generationStep(undefined, ''), 'queued');
  assert.equal(generationStep('running', lines.slice(0, 2).join('\n')), 'generating');
  assert.equal(generationStep('running', lines.slice(0, 3).join('\n')), 'building');
  assert.equal(generationStep('running', lines.join('\n')), 'publishing');
  assert.equal(generationStep('succeeded', lines.join('\n')), 'published');
});

test('failure wins over previously successful build logs', () => {
  assert.equal(generationStep('failed', 'Docker application build passed\nDeployment status: queued for Dokploy'), 'failed');
});
