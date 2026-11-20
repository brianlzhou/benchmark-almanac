// Mitosis Bench (Dylan Tirandaz, a Prime Intellect residency environment): models mark the dividing cells in tiles
// from the MIDOG dataset, 100 tasks with five attempts each. The results are a chart on the project page, not a
// table, so this reads the chart itself: each model's line of pass@1 to pass@5 (the headline is pass@1), placed on
// the chart's own axis, with the model named by the color its caption gives it and the cost of one attempt. Model
// calls per attempt come from the second chart, and the requests table gives reasoning tokens and thinking time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://dylantirandaz.com/projects.html/mitosisbench/';
const N = 5;
const num = (s: string) => Number(s.replace(/[^\d.]/g, ''));

const board: Leaderboard = {
  benchmark: 'mitosis-bench',
  url: PAGE,
  feed: `${PAGE} (section 4: the pass@k chart and its caption, the attempts chart and the requests table)`,
  terms: 'A personal project page with no stated data license and no robots.txt restriction. Results are credited to Dylan Tirandaz.',
  async fetch() {
    const html = await fetchText(PAGE);
    const results = html.slice(html.indexOf('id="results"'));
    const svg = results.slice(0, results.indexOf('</svg>'));
    const caption = results.slice(results.indexOf('<figcaption>'), results.indexOf('</figcaption>'));
    // the axis: where 0% and the highest labeled percent sit, so a point's height reads back as a percent
    const ticks = [...svg.matchAll(/<text x="[\d.]+" y="([\d.]+)" text-anchor="end" class="muted">(\d+)%<\/text>/g)].map((m) => ({ y: Number(m[1]) - 5, v: Number(m[2]) }));
    const lo = ticks.find((t) => t.v === 0);
    const hi = ticks.at(-1);
    if (!lo || !hi || hi.v === 0) throw new Error('Mitosis Bench: chart axis missing');
    const pct = (y: number) => Math.round(((lo.y - y) / (lo.y - hi.y)) * hi.v * 10) / 10;
    const named = [...caption.matchAll(/background:(#[0-9a-f]{6})"><\/i>\s*([^(<]+?)\s*\(\$([\d.]+) per attempt\)/gi)].map((m) => ({ color: m[1].toLowerCase(), name: m[2].trim(), cost: Number(m[3]) }));
    // model calls per attempt (the second chart) and the requests table, by model name
    const after = results.slice(results.indexOf('</figure>'));
    const text = after.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const calls = new Map<string, number>();
    const table = new Map<string, number[]>();
    for (const { name } of named) {
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const c = text.match(new RegExp(`${esc} (\\d+\\.\\d) (?=[A-Z]|Model calls)`));
      if (c) calls.set(name, Number(c[1]));
      const t = text.match(new RegExp(`${esc} ([\\d,]+) (\\d+) ([\\d.]+) s ([\\d.]+) min`));
      if (t) table.set(name, [num(t[1]), Number(t[2]), Number(t[3]), Number(t[4])]);
    }
    const rows: LeaderboardRow[] = [];
    for (const m of named) {
      const line = svg.match(new RegExp(`<polyline points="([^"]+)" fill="none" stroke="${m.color}"`, 'i'));
      if (!line) throw new Error(`Mitosis Bench: no line for ${m.name}`);
      const ys = line[1].trim().split(/\s+/).map((p) => Number(p.split(',')[1]));
      if (ys.length !== 5) throw new Error(`Mitosis Bench: ${m.name} has ${ys.length} points, expected pass@1 to pass@5`);
      const [p1, p2, p3, p4, p5] = ys.map(pct);
      const t = table.get(m.name);
      rows.push({
        model: m.name,
        score: p1,
        trials: 5,
        cost: m.cost,
        metrics: {
          pass2: p2,
          pass3: p3,
          pass4: p4,
          pass5: p5,
          ...(calls.has(m.name) ? { callsPerAttempt: calls.get(m.name)! } : {}),
          ...(t ? { requests: t[0], reasoningTokensPerRequest: t[1], latency: Math.round(t[3] * 60) } : {}),
        },
      });
    }
    if (rows.length < N) throw new Error(`Mitosis Bench: ${rows.length} models, expected at least ${N}`);
    return rows;
  },
};
export default board;
