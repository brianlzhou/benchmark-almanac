// ViStoryBench evaluates the consistency and quality of illustrated stories.
// The official Full board ranks configurations across 80 stories. Lower overall rank is better.
// The live board does not identify its evaluator revision. Lite ranks cover a different set of stories.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://vistorybench.github.io/';
const ranks = { characterRank: 'Character Consistency(CIDS)_rank', styleRank: 'Style Consistency(CSD)_rank',
  alignmentRank: 'Prompt Alignment_rank', qualityRank: 'Generative Quality_rank', diversityRank: 'Diversity_rank' };
const measures = { crossCsd: 'Cross CSD Score (Ref-Gen)', selfCsd: 'Self CSD Score (Gen-Gen)',
  crossCids: 'Cross CIDS Score (Ref-Gen)', selfCids: 'Self CIDS Score (Gen-Gen)', paScene: 'PA Scene',
  paShot: 'PA Shot', paCI: 'PA CI', paIA: 'PA IA', paAvg: 'PA Avg', cm: 'CM',
  inceptionScore: 'Inception Score', aestheticsScore: 'Aesthetics Score', cp: 'CP' };
type Entry = Record<string, string>;
function fullTable(page: string, columns: string[]) {
  const raw = page.match(/const fullResultsData = (\{"headers".*?\});/);
  if (!raw) throw Error('Missing full ViStoryBench table');
  const { headers, data } = JSON.parse(raw[1]) as { headers: string[]; data: Entry[] };
  if (!['model', 'mode', ...columns].every(k => headers.includes(k))) throw Error('Missing full board columns');
  return data;
}
function number(row: Entry, key: string) {
  if (!/^\d+(?:\.\d+)?$/.test(row[key])) throw Error('Invalid ' + key + ' for ' + row.model);
  return Number(row[key]);
}
const board: Leaderboard = {
  benchmark: 'vistorybench', url: feed, feed,
  terms: 'The project licenses the benchmark code and results under MIT. https://vistorybench.github.io/#about',
  headline: 'The Full leaderboard reports overall rank across 80 stories. A lower rank is better.',
  parts: Object.fromEntries(Object.entries(ranks).map(([key, label]) => [key, { name: label.replace('_rank', ' rank'), better: 'lower', unit: 'score' }])),
  async fetch() {
    const ranking = fullTable(await fetchText(feed), ['overall_rank', ...Object.values(ranks)]);
    await new Promise(resolve => setTimeout(resolve, 1050));
    const details = fullTable(await fetchText(feed + 'leaderboard_detail/'), Object.values(measures));
    const key = (row: Entry) => JSON.stringify([row.Method, row.model, row.mode]);
    const byModel = new Map(details.map(r => [key(r), r]));
    const rows = ranking.map(row => {
      const detail = byModel.get(key(row));
      if (!detail) throw Error('Missing full-mode scores for ' + row.model);
      const metrics = Object.fromEntries([...Object.entries(ranks).map(([k, col]) => [k, number(row, col)]),
        ...Object.entries(measures).map(([k, col]) => [k, number(detail, col)])]);
      return { model: row.model, setting: row.mode, score: number(row, 'overall_rank'), metrics };
    });
    return checked(rows, 21);
  },
};
export default board;
