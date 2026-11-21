// ONESTRUCTION measures execution accuracy on 514 IFC questions. Its ranking page embeds the
// IFC-specific scores, evaluation dates, measured time and token totals for each model.
import type { Leaderboard } from './types.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed = "https://ai.onestruction.com/leaderboard/en/benchmarks/ifc/";
const board: Leaderboard = {
  benchmark: 'ifc-bench-2',
  url: "https://ai.onestruction.com/leaderboard/en/benchmarks/ifc/",
  feed,
  terms: "ONESTRUCTION claims copyright and gives no explicit results license. Cloudflare robots.txt restricts named crawlers. The importer excludes open-model pricing from Artificial Analysis.",
  host: 'ONESTRUCTION',
  async fetch() {
    const models = jsonAfter<{ name: string; access: string; effort: string; scores: { ifc: {
      value: number; evaluatedOn: string; outputTokens: number; inputTokens: number; perTask: { seconds: number; cost: number } } } }[]>(
      nextFlight(await fetchText(feed)), '"models":');
    if (models.length < 20) throw new Error('Incomplete IFC-Bench v2 ranking');
    return models.map(m => {
      const r = m.scores.ifc;
      if (!m.name || !Number.isFinite(r?.value) || !Number.isFinite(r.perTask.seconds)) throw new Error('Invalid IFC score');
      return { model: m.name, score: r.value, setting: m.effort === '$undefined' ? undefined : m.effort, open: m.access === 'open',
        date: r.evaluatedOn, cost: m.access === 'commercial' ? r.perTask.cost : undefined, tokens: r.outputTokens / 514,
        metrics: { latency: r.perTask.seconds, inputTokens: r.inputTokens / 514 } };
    });
  },
};
export default board;
