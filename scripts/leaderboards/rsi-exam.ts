// RSI-Exam on rsi-exam.ai. The home page is static HTML: the leaderboard is drawn as inline SVG, one
// <svg class="hlb"> per task split (all 88 active tasks, 35 public, 53 private). The default view is all 88
// tasks, so that SVG is read: each row (g.hlbrow) has the model (hlbmodel), "harness · effort" (hlbsub) and
// the mean held-out normalised score, 0 to 1 (hlbval), times 100 here. The page's cost chart data
// (<script id="effdata">) gives average spend and output tokens per task for most models, joined by name and
// harness line.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://rsi-exam.ai/';

const board: Leaderboard = {
  benchmark: 'rsi-exam',
  url: PAGE,
  feed: `${PAGE} (inline SVG leaderboard, all 88 tasks; effdata JSON for cost)`,
  terms: 'Static page; rsi-exam.ai robots.txt sets no rules or content signals, and the page states no terms.',
  async fetch() {
    const html = await fetchText(PAGE);
    const svg = html.split('<svg class="hlb"').slice(1).find((s) => /over all \d+ active tasks/.test(s.slice(0, 300)));
    if (!svg) throw new Error('all-tasks leaderboard not found');
    const body = svg.slice(0, svg.indexOf('</svg>'));
    const eff = html.match(/<script id="effdata" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    const costs = new Map(
      (eff ? (JSON.parse(eff) as { name: string; sub: string; cost?: number; out?: number }[]) : []).map((e) => [`${e.name}|${e.sub}`, e]),
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
      rows.push({ model, score: value * 100, harness: harness || undefined, setting: setting || undefined, cost: e?.cost, tokens: e?.out });
    }
    return rows;
  },
};
export default board;
