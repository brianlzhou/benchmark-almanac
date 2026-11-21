// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// MTEB Arena compares embeddings by anonymous votes on retrieval, clustering and semantic textual similarity.
// The maintainers retain each leaderboard as a CSV in results/latest even while the Arena is offline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const base = 'https://raw.githubusercontent.com/embeddings-benchmark/arena/HEAD/results/latest/';
const parts = { retrieval: 'Retrieval', clustering: 'Clustering', sts: 'STS' };
const board: Leaderboard = {
  benchmark: 'mteb-arena', url: 'https://github.com/embeddings-benchmark/arena/tree/main/results/latest',
  feed: base + 'retrieval_leaderboard.csv',
  terms: 'The MTEB Arena team publishes the leaderboard exports. https://github.com/embeddings-benchmark/arena',
  headline: 'Plain mean of the anonymous Arena Elo ratings on retrieval, clustering, and STS.', parts,
  async fetch() {
    const models = new Map<string, LeaderboardRow>();
    for (const task of Object.keys(parts)) {
      if (models.size) await new Promise(resolve => setTimeout(resolve, 1000));
      for (const entry of parseCsv(await fetchText(base + task + '_leaderboard.csv'))) {
        const key = entry.key, rating = entry['Arena Elo rating (anony)'];
        if (!key || !entry.Model || !rating || !Number.isFinite(Number(rating))) throw new Error('Invalid Arena entry');
        const row = models.get(key) ?? { model: entry.Model, license: entry.License, link: entry.Link, score: 0, metrics: {} };
        if (task in row.metrics! || row.model !== entry.Model) throw new Error('Ambiguous Arena entry');
        row.metrics![task] = Number(rating);
        models.set(key, row);
      }
    }
    return checked([...models.values()].filter(row => Object.keys(parts).every(task => task in row.metrics!)).map(row =>
      ({ ...row, score: Object.values(row.metrics!).reduce((sum, n) => sum + n, 0) / 3 })), 14);
  },
};
export default board;
