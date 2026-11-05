// RSI-Exam on rsi-exam.ai. The home page is static HTML: the leaderboard is drawn as inline SVG, one
// <svg class="hlb"> per task split (all 88 active tasks, 35 public, 53 private). The default view is all 88
// tasks, so that SVG is read: each row (g.hlbrow) has the model (hlbmodel), "harness · effort" (hlbsub) and
// the mean held-out normalised score, 0 to 1 (hlbval), times 100 here. The page's cost chart data
// (<script id="effdata">) gives average spend and output tokens per task for most models, joined by name and
// harness line. Its average run time per task, in minutes, is kept as metrics.minutes: the page's "Model resource
// comparison" chart plots the score against it (and against spend and output tokens).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://rsi-exam.ai/';

const board: Leaderboard = {
  benchmark: 'rsi-exam',
  url: PAGE,
  feed: `${PAGE} (inline SVG leaderboard, all 88 tasks; effdata JSON for cost)`,
  terms: 'Static page; rsi-exam.ai robots.txt sets no rules or content signals, and the page states no terms.',
  chart: {
    title: 'Model resource comparison: average run time',
    note: 'Mean hidden-set score over the 88 published tasks against how long one task took on average.',
    x: { key: 'minutes', label: 'Average run time per task', unit: 'min', better: 'lower' },
    y: { key: 'score', label: 'Mean held-out normalized score', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const svg = html.split('<svg class="hlb"').slice(1).find((s) => /over all \d+ active tasks/.test(s.slice(0, 300)));
    if (!svg) throw new Error('all-tasks leaderboard not found');
    const body = svg.slice(0, svg.indexOf('</svg>'));
    const eff = html.match(/<script id="effdata" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    const costs = new Map(
      (eff ? (JSON.parse(eff) as { name: string; sub: string; cost?: number; out?: number; time?: number }[]) : []).map((e) => [`${e.name}|${e.sub}`, e]),
    );
    const rows: LeaderboardRow[] = [];
    for (const g of body.split('class="hlbrow"').slice(1)) {
      const field = (cls: string) => text(g.match(new RegExp(`class="${cls}"[^>]*>([^<]*)<`))?.[1] ?? '');
      const model = field('hlbmodel');
      const sub = field('hlbsub');
      const value = Number(field('hlbval'));
      if (!model || !Number.isFinite(value)) continue;
      const [harness, setting] = sub.split('·').map((s) => s.trim());
      const e = costs.get(`${model}|${sub}`);
      const metrics = typeof e?.time === 'number' ? { minutes: e.time } : undefined;
      rows.push({ model, score: value * 100, harness: harness || undefined, setting: setting || undefined, cost: e?.cost, tokens: e?.out, metrics });
    }
    return rows;
  },
};
export default board;
