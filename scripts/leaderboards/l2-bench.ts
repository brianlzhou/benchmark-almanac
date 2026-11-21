// L2-Bench scores language teaching competencies. The dashboard embeds its overall scores and competency results in JSON.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://benchmarks.elt.edu.oup.com/dashboard";

interface Entry { modelName: string; modelId: string; inference: string; setting: string; overall: number; costPerTask: number; executedAt: string; runCount: number; scores: Record<string, number> }

const board: Leaderboard = {
  benchmark: "l2-bench",
  url: "https://benchmarks.elt.edu.oup.com/dashboard",
  feed: FEED,
  terms: "The leaderboard page gives no separate reuse license. https://benchmarks.elt.edu.oup.com/dashboard",
  async fetch() {
    const html = await fetchText(FEED);
    const data = jsonAfter<{entries: Entry[]; competencies: {code: string; name: string}[]}>(html, 'id="lb-payload">');
    if (data.entries.length < 9 || data.competencies.length < 12) throw new Error('Incomplete L2-Bench dashboard');
    this.parts = Object.fromEntries(data.competencies.map(c => [c.code, c.name]));
    const base = html.match(/data-model-url="([^"]+)"/)?.[1];
    return data.entries.map((r): LeaderboardRow => {
      if (!r.modelName || !Number.isFinite(r.overall) || !data.competencies.every(c => Number.isFinite(r.scores[c.code]))) throw new Error('Missing model or competency score');
      return { model: r.modelName, setting: [r.inference, r.setting].filter(Boolean).join(', '), score: r.overall, cost: r.costPerTask, trials: r.runCount, date: r.executedAt, metrics: r.scores, link: base ? new URL(base + encodeURIComponent(r.modelId), FEED).href : undefined };
    });
  },
};
export default board;
