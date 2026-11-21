// MATH-500 on Vals AI. The leaderboard's Accuracy column is exact-answer accuracy on the 500-question
// MATH-500 split, updated 2026-01-09. Vals runs models in one evaluation harness; labs more often report
// pass@1 with different prompting. The chart supplies per-test cost, standard error and latency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://www.vals.ai/benchmarks/math500';
const board: Leaderboard = {
  benchmark: 'math-500',
  host: 'Vals AI',
  url: FEED,
  feed: FEED,
  aliases: {
    'Gemini 3 Pro (11/25)': 'gemini-3-pro',
    'Qwen 3 (235B)': 'qwen3-235b-a22b',
    'Kimi K2 Instruct': 'kimi-k2-jul-2025',
    'Gemini 2.5 Flash Preview 4/17 (Thinking)': 'gemini-2-5-flash-apr-2025',
    'DeepSeek V3 (03/24/2025)': 'deepseek-v3-mar-2025',
  },
  terms: 'Vals AI publishes public benchmark results and methodology. The almanac credits and links Vals AI and follows its source terms.',
  stats: {
    priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' },
    priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' },
    latency: { name: 'Latency', unit: 'seconds', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const raw = html.match(/props="(\{&quot;benchmarkView&quot;[^"]*)"/)?.[1];
    type Run = Record<string, [number, number?]>;
    const chart = raw ? JSON.parse(raw.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')) : undefined;
    const runs: Record<string, [number, Run]> = chart?.benchmarkView?.[1]?.tasks?.[1]?.overall?.[1] ?? {};
    const table = tables(html).find((t) => t[0]?.some((c) => c.text === 'Accuracy'));
    if (!table) throw new Error('MATH-500 Vals table missing');
    const headers = table[0].map((c) => c.text);
    const model = headers.indexOf('Model');
    const score = headers.indexOf('Accuracy');
    if (model < 0 || score < 0) throw new Error('MATH-500 Vals columns missing');
    const rows = table.slice(1).flatMap((r) => {
      const value = num(r[score]?.text);
      const name = r[model]?.text.trim();
      const prices = r[headers.indexOf('Cost In / Out')]?.text.match(/\$([\d.]+)\s*\/\s*\$([\d.]+)/);
      const latency = num(r[headers.indexOf('Latency')]?.text);
      const metrics = { ...(prices ? { priceIn: Number(prices[1]), priceOut: Number(prices[2]) } : {}), ...(latency !== undefined ? { latency } : {}) };
      if (!name || value === undefined) return [];
      const href = r[model]?.html.match(/href="(\/models\/[^"]+)"/)?.[1];
      const key = href?.slice('/models/'.length).replace('_', '/');
      const run = key ? runs[key]?.[1] : undefined;
      const same = typeof run?.accuracy?.[1] === 'number' && Math.abs(run.accuracy[1] - value) < 0.006;
      const stderr = same ? run?.stderr?.[1] : undefined;
      const mode = name.match(/\((Thinking|Nonthinking)\)/i)?.[1]?.toLowerCase();
      return [{ model: name, score: value, setting: ['Vals AI harness', mode].filter(Boolean).join(', '),
        cost: same ? run?.cost_per_test?.[1] : undefined, link: href ? new URL(href, FEED).href : undefined,
        low: stderr != null ? value - 1.96 * stderr : undefined, high: stderr != null ? value + 1.96 * stderr : undefined,
        metrics: { ...metrics, ...(stderr != null ? { stderr } : {}) } }];
    });
    if (!rows.length) throw new Error('MATH-500 Vals rows missing');
    return rows;
  },
};
export default board;
