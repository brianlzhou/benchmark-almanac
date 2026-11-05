// PhysicianBench (Stanford HealthRex). The project page is a static Next.js export whose leaderboard is an
// HTML table: # | Model | Provider | Pass@1 ±SD | Pass@3 | Pass³ | #Turns, averaged over three runs.
// Pass@1 (0 to 100) is the default sort and the score. The ± spread (SD over the runs) is dropped. Pass@3,
// Pass³ and #Turns are kept as metrics.passAt3, pass3 and steps.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://healthrex.github.io/PhysicianBench/';

const board: Leaderboard = {
  benchmark: 'physicianbench',
  url: URL,
  feed: `${URL} (static HTML table, Pass@1)`,
  terms: 'Static GitHub Pages site; the page states no terms.',
  aliases: {
    'Gemini Pro 3.1': 'gemini-3-1-pro',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Pass@1/.test(c.text)));
    if (!t) throw new Error('PhysicianBench table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iScore = head.findIndex((h) => /^Pass@1/.test(h));
    const extra = { passAt3: head.findIndex((h) => /^Pass@3/.test(h)), pass3: head.findIndex((h) => /^Pass(³|\^3)/.test(h)), steps: head.findIndex((h) => /^#\s*Turns/i.test(h)) };
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // open-weight models carry an "open" badge after the name
      const model = r[iModel]?.text.replace(/\s+open$/i, '');
      const score = num(r[iScore]?.text);
      const metrics: Record<string, number> = {};
      for (const [k, i] of Object.entries(extra)) {
        const v = i >= 0 ? num(r[i]?.text) : undefined;
        if (v !== undefined) metrics[k] = v;
      }
      if (model && score !== undefined) rows.push({ model, score, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return rows;
  },
};
export default board;
