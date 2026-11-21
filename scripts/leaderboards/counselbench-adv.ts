// CounselBench-Adv measures the fraction of responses exhibiting a targeted counseling failure.
// The Slingshot leaderboard embeds its full-precision headline scores, settings and issue breakdowns.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';
interface SlingshotModel {
  id: string; displayName: string; access: string; scores: Record<string, number>;
  settings: Record<string, Record<string, string>>; views: Record<string, Record<string, number>[]>;
}
export async function slingshotRows(board: Leaderboard, task: string, metric: string) {
  const flight = nextFlight(await fetchText(board.feed));
  const start = flight.indexOf('{"benchmark":{"id":"' + task + '"');
  if (start < 0) throw new Error('Missing Slingshot benchmark ' + task);
  const data = jsonAt<{ benchmark: { metric: string; views: { title: string; higher_is_better?: boolean; columns: {key: string; label: string}[] }[] }; models: SlingshotModel[] }>(flight, start);
  if (data.benchmark.metric !== metric) throw new Error('Unexpected Slingshot metric for ' + task);
  const models = data.models.filter(m => m.scores[task] != null);
  if (models.length < 10) throw new Error('Missing Slingshot results for ' + task);
  board.parts = {};
  return models.map(m => {
    if (!Number.isFinite(m.scores[task]) || !m.displayName) throw new Error('Invalid score or model');
    const metrics: Record<string, number> = {};
    data.benchmark.views.forEach((view, i) => {
      for (const col of view.columns) {
        const value = m.views[task]?.[i]?.[col.key];
        if (typeof value !== 'number') continue;
        const key = 'view' + i + '_' + col.key;
        metrics[key] = value;
        board.parts![key] = { name: col.label, group: view.title, better: view.higher_is_better === false ? 'lower' : 'higher' };
      }
    });
    return { model: m.displayName, score: m.scores[task], metrics, open: m.access === 'open-weights',
      setting: Object.entries(m.settings[task] ?? {}).map(([k, v]) => k + ' ' + v).join(', ') || undefined,
      link: 'https://github.com/slingshot-ai/mheval-leaderboard/blob/main/results/' + encodeURIComponent(m.id) + '/' + task + '.json' };
  });
}

const FEED = "https://mheval.slingshotai.com/counselbench_adv/";
const board: Leaderboard = {
  benchmark: "counselbench-adv",
  url: "https://mheval.slingshotai.com/counselbench_adv/",
  feed: FEED,
  terms: "The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license The leaderboard's robots URL returns HTML.",
  aliases: { 'GPT-4o': 'gpt-4o-aug-2024', 'GPT-5': 'gpt-5' },
  async fetch() {
    return slingshotRows(board, 'counselbench_adv', 'failure_rate');
  },
};
export default board;
