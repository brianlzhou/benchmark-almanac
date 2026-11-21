import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2511.07685';
const board: Leaderboard = {
  benchmark: 'researchrubrics', static: 'paper', url: URL, feed: URL + ' (overall compliance scores)', terms: PAPER_TERMS,
  harnesses: 'system',
  stats: { binary: { name: 'Binary rubric score', unit: '%', better: 'higher' } },
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.join('|') === 'Model|Ternary|Binary');
    if (!t || t.length < 4) throw new Error('ResearchRubrics compliance table missing');
    return t.slice(1).map(r => ({model: r[0].replace(' DR', ' Deep Research'), harness: r[0].replace(' DR', ' Deep Research'),
      score: Number(r[1]) * 100, setting: 'Ternary rubric grading', metrics: {binary: Number(r[2]) * 100}}));
  },
};
export default board;
