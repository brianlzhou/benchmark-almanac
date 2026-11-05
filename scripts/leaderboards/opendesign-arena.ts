// OpenDesign Arena on open-design.ai/llm-arena-for-design/. The Astro page embeds its ranking as
// <script type="application/json" id="model-rankings-data">: per model the overall evaluation score out of
// 100 (the board's headline), mean cost per artifact in US dollars and mean output tokens, plus per-scenario
// breakdowns. The overall score is the score; cost and tokens are passed on. The mean completion time per
// artifact ("time", seconds) is metrics.latency, the default x-axis of the page's "Model efficiency" chart,
// and the mean time to first token ("ttft", seconds) is metrics.ttft.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://open-design.ai/llm-arena-for-design/';

const board: Leaderboard = {
  benchmark: 'opendesign-arena',
  url: PAGE,
  feed: `${PAGE} (inline JSON #model-rankings-data, score)`,
  terms: 'Public page; open-design.ai robots.txt allows all agents except /og/, and the page states no reuse limits for the rankings.',
  chart: {
    title: 'Model efficiency',
    note: 'Average score against mean completion time per artifact; the page can also plot cache hit rate and token use.',
    x: { key: 'latency', label: 'Completion time', unit: 's', better: 'lower' },
    y: { key: 'score', label: 'Average score', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const json = html.match(/<script type="application\/json" id="model-rankings-data">([\s\S]*?)<\/script>/)?.[1];
    if (!json) throw new Error('model-rankings-data not found');
    const data = JSON.parse(json) as { name: string; score: number; cost?: number; outputTokens?: number; time?: number | null; ttft?: number | null }[];
    return data.map((m): LeaderboardRow => {
      const metrics: Record<string, number> = {};
      if (typeof m.time === 'number' && m.time > 0) metrics.latency = m.time;
      if (typeof m.ttft === 'number' && m.ttft > 0) metrics.ttft = m.ttft;
      return { model: m.name, score: m.score, cost: m.cost, tokens: m.outputTokens, metrics: Object.keys(metrics).length ? metrics : undefined };
    });
  },
};
export default board;
