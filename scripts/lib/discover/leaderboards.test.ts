import test from 'node:test';
import assert from 'node:assert/strict';
import { kaggleMeetsBar, kagglePath } from './leaderboards.ts';

test('a Kaggle benchmark is a find when an organization published it or five models are on its board', () => {
  const hfe = { slug: 'hfe', name: "Humanity's First Exam (HFE)", published: true, organization: { name: 'Google DeepMind', slug: 'deepmind' }, ownerUser: { userName: 'kencavanagh' }, version: {} };
  assert.equal(kagglePath(hfe), 'deepmind/hfe');
  assert.equal(kaggleMeetsBar(hfe), true);
  const community = (models: number) => ({ slug: 'grid-perception-reliability', published: true, ownerUser: { userName: 'flamki' }, version: { leaderboardModelVersionsCount: models } });
  assert.equal(kagglePath(community(5)), 'flamki/grid-perception-reliability');
  assert.equal(kaggleMeetsBar(community(5)), true);
  assert.equal(kaggleMeetsBar(community(4)), false);
  assert.equal(kagglePath({ ...community(9), published: false }), undefined);
});
