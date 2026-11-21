// Slingshot AI ranks CBT-Bench Level II by mean weighted F1 across three classification tasks.
// The leaderboard embeds the headline scores, task and label breakdowns, and model settings in its page data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';

interface View { title: string; columns: { key: string; label: string }[] }
interface Model {
  displayName: string; access: string; url: string; scores: Record<string, number | null>;
  views: Record<string, Record<string, number>[]>; settings: Record<string, Record<string, string>>;
}

export async function slingshotRows(board: Leaderboard, id: string, metric: string, minimumParts: number) {
  const page = nextFlight(await fetchText(board.feed));
  const config = jsonAfter<{ id: string; metric: string; views: View[] }>(page, '"benchmark":');
  if (config.id !== id || config.metric !== metric) throw new Error('Unexpected Slingshot benchmark or metric');
  const models = jsonAfter<Model[]>(page, '"models":');
  const columns = config.views.flatMap((view, i) => view.columns.map(col => ({
    ...col, index: i, group: view.title, metricKey: col.key.replace(/[^a-zA-Z0-9]+/g, '_'),
  })));
  if (columns.length < minimumParts) throw new Error('Missing Slingshot score columns');
  board.parts = Object.fromEntries(columns.map(c => [c.metricKey, { name: c.label, group: c.group }]));
  const ranked = models.filter(m => m.scores[id] != null);
  if (ranked.length < 10) throw new Error('Expected ten ranked models');
  return ranked.map(m => {
    const metrics: Record<string, number> = {};
    for (const c of columns) {
      const value = m.views[id]?.[c.index]?.[c.key];
      if (!Number.isFinite(value)) throw new Error('Missing ' + c.label + ' for ' + m.displayName);
      metrics[c.metricKey] = value;
    }
    if (!m.displayName || !Number.isFinite(m.scores[id])) throw new Error('Missing headline result');
    const setting = Object.entries(m.settings[id] ?? {}).map(([k, v]) => k + '=' + v).join(', ');
    return { model: m.displayName, score: m.scores[id]!, metrics, link: m.url || undefined,
      open: m.access === 'open-weights' ? true : undefined, setting: setting || undefined };
  });
}

const feed = "https://mheval.slingshotai.com/cbt_bench/";
const board: Leaderboard = {
  benchmark: 'cbt-bench-level-2',
  url: "https://mheval.slingshotai.com/cbt_bench/",
  feed,
  terms: "The board serves HTML at robots.txt. The results repository uses the MIT license. The original authors retain rights to their benchmark materials. https://github.com/slingshot-ai/mheval-leaderboard/blob/main/README.md#license",
  host: 'Slingshot AI',
  aliases: { 'GPT-4o': 'gpt-4o-aug-2024' },
  async fetch() {
    return slingshotRows(board, 'cbt_bench', 'mean_weighted_f1', 16);
  },
};
export default board;
