import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { READINESS_QUESTIONS, readinessScore } = require('./readiness.js');
const { validate } = require('./api/assess.js');

const pick = (i) => Object.fromEntries(READINESS_QUESTIONS.map((q) => [q.id, q.options[Math.min(i, q.options.length - 1)].id]));
const best = Object.fromEntries(READINESS_QUESTIONS.map((q) => [q.id, q.options.reduce((a, b) => (b.pts > a.pts ? b : a)).id]));

test('score bands', () => {
  assert.deepEqual(readinessScore(pick(0)), { score: 0, band: 'Starting', gaps: 8 });
  assert.deepEqual(readinessScore(best), { score: 100, band: 'Ready', gaps: 0 });
  assert.equal(readinessScore(pick(1)).band, 'Emerging');
});

test('score rejects missing or unknown answers', () => {
  assert.equal(readinessScore({}), null);
  assert.equal(readinessScore({ ...best, ai: 'nope' }), null);
});

test('validate', () => {
  const ok = { email: 'a@b.co', businessType: 'Yoga studio', website: 'x.com', answers: best };
  assert.equal(validate(ok).result.score, 100);
  assert.ok(validate({ ...ok, email: 'nope' }).error);
  assert.ok(validate({ ...ok, businessType: '' }).error);
  assert.ok(validate({ ...ok, website: 'x'.repeat(201) }).error);
  assert.ok(validate({ ...ok, answers: { ...best, data: 'evil' } }).error);
  assert.ok(validate(undefined).error);
});
