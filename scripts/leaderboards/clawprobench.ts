// ClawProBench: use the open dataset Final Score, the page’s stated default ranking.
// The closed dataset is a separate task set. Costs and tokens are whole-run totals, kept as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://suyoumo.github.io/bench/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "clawprobench",
  url: "https://suyoumo.github.io/bench/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at suyoumo.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  chart: {title: 'Final Score versus cost', x: {key: 'runCost', label: 'Total run cost', unit: '$', better: 'lower'}, y: {key: 'score', label: 'Final Score', unit: '%', better: 'higher'}, note: 'The source reports whole-run costs and token totals, not per-task averages.'},
  async fetch() {
    const out: LeaderboardRow[] = [];
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Final Score'));
    if (!t) throw new Error('ClawProBench table missing');
    const head = t[0].map(c => c.text);
    for (const r of t.slice(1)) {
      const model = text(r[1]?.html.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] ?? '');
      const score = num(r[2]?.attrs['data-value']); if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (let i = 3; i < 14; i++) { const v = num(r[i]?.attrs['data-value']); if (v !== undefined) metrics[head[i]] = v * 100; }
      for (const [key, i] of [['latency',14],['runTokens',15],['runCost',17]] as const) { const v = num(r[i]?.attrs['data-value']); if (v !== undefined) metrics[key] = v; }
      const output = r[16]?.text.match(/output:\s*([\d,]+)/)?.[1]; if (output) metrics.runOutputTokens = Number(output.replace(/,/g,''));
      out.push({model: identity(model), score, setting: /Closed Dataset/.test(r[1].text) ? 'Closed Dataset' : 'Open Dataset', harness: `OpenClaw ${r[19]?.text}`, date: r[21]?.text, metrics});
    }
    if (!out.length) throw new Error('ClawProBench scores missing');
    return out.filter(r => r.setting === 'Open Dataset').map(r => ({...r, setting:undefined}));
  },
};
export default board;
