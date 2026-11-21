// ADVANCE evaluates audio to image and image to audio retrieval on paired geotagged recordings and aerial images.
// The source reports no overall score, so this importer uses the plain mean of the two nDCG@10 directions.
// The MTEB pull request comments publish the two-direction results on a 500-query subsample.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED = 'https://api.github.com/repos/embeddings-benchmark/mteb/issues/5119/comments';
const board: Leaderboard = {
  benchmark: 'advance-mteb', url: 'https://github.com/embeddings-benchmark/mteb/pull/5119', feed: FEED,
  terms: 'The MTEB repository is public under its repository license. Cite MTEB and the ADVANCE dataset.',
  static: 'paper', headline: 'The source reports no overall score, so this is the plain mean of the two retrieval directions.',
  parts: { a2i: { name: 'Audio to image', group: 'Direction' }, i2a: { name: 'Image to audio', group: 'Direction' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const comments = JSON.parse(await fetchText(FEED)) as Array<{ body?: string }>;
    const body = comments.map(c => c.body ?? '').join('\n');
    const rows: LeaderboardRow[] = [
      { model: 'mteb/baseline-random-encoder', score: 0.01035, metrics: { a2i: 0.0112, i2a: 0.0095 } },
      { model: 'jinaai/jina-embeddings-v5-omni-nano', score: 0.0228, metrics: { a2i: 0.0221, i2a: 0.0235 } },
    ];
    if (!/A2I direction:.*0\.0112.*0\.0221/s.test(body) || !/I2A direction:.*0\.0095.*0\.0235/s.test(body)) throw new Error('ADVANCE results missing');
    return checked(rows);
  },
};
export default board;
