// SlopCodeBench. www.scbench.ai/leaderboard is a Next.js page whose server HTML carries the full results
// table: Model (effort) | Harness | Version | Strict Solve | Iso Solve | $/CKPT | Erosion | Verbosity. The
// table is sorted by Iso Solve, the "isolated solve" rate the home page leads with, so that is the score
// (0 to 100). The harness column is the agent; $/CKPT, the cost of one checkpoint (the unit the agent
// solves), is the cost. Strict Solve, Erosion and Verbosity are kept in metrics as "strictSolve", "erosion"
// and "verbosity". Additional published runs come from the serialized data prop.
// Harness versions belong to the harness; published rank is a metric, not a setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, jsonAfter } from '../lib/html.ts';

const URL = 'https://www.scbench.ai/leaderboard';

const board: Leaderboard = {
  benchmark: 'slopcodebench',
  url: URL,
  feed: `${URL} (server-rendered table, Iso Solve)`,
  terms: 'Server-rendered public page; scbench.ai serves no robots.txt (the path returns a 404 page) and publishes no terms.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const t = tables(html).find((rows) => rows[0]?.some((c) => /^Iso Solve/.test(c.text)));
    if (!t) throw new Error('SlopCodeBench table not found');
    const head = t[0].map((c) => c.text.replace(/\s*[▲▼]$/, ''));
    const col = (name: string) => head.indexOf(name);
    const [iModel, iHarness, iScore, iCost] = [col('Model'), col('Harness'), col('Iso Solve'), col('$/CKPT')];
    const extra = [
      ['strictSolve', col('Strict Solve')],
      ['erosion', col('Erosion')],
      ['verbosity', col('Verbosity')],
    ] as const;
    if ([iModel, iHarness, iScore].some((i) => i < 0)) throw new Error(`unexpected columns: ${head.join(', ')}`);
    const rows: LeaderboardRow[] = t.slice(1).map((r) => {
      const name = r[iModel]?.text ?? '';
      const effort = /\(([^)]+)\)$/.exec(name)?.[1]?.toLowerCase();
      const metrics: Record<string, number> = {};
      for (const [k, i] of extra) {
        const v = i >= 0 ? num(r[i]?.text) : undefined;
        if (v !== undefined) metrics[k] = v;
      }
      return {
        model: name.replace(/\s*\([^)]*\)$/, ''),
        score: num(r[iScore]?.text) ?? NaN,
        setting: effort,
        harness: r[iHarness]?.text || undefined,
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
    // Next's data prop includes runs hidden by the default table's model filter.
    const payload = [...html.matchAll(/self\.__next_f\.push\((\[1,.*?\])\)<\/script>/g)]
      .map(m => JSON.parse(m[1])[1]).join('');
    const runs = jsonAfter<any[]>(payload, '"data":');
    if (!Array.isArray(runs)) throw new Error('Missing full SlopCodeBench runs');
    const originalRows = rows.slice();
    const used = new Set<number>();
    for (const r of runs) {
      if (typeof r.pct_checkpoints_iso_solved !== 'number') continue;
      const score = Math.round(r.pct_checkpoints_iso_solved * 100) / 100;
      const effort = String(r.thinking).toLowerCase();
      const existing = originalRows.findIndex((x,i) => !used.has(i) && x.model === r.model && x.harness === r.agent && x.setting === effort && x.score === score);
      if (existing >= 0) { used.add(existing); rows[existing].harness=[r.agent,r.agentVersion].filter(Boolean).join(' '); continue; }
      rows.push({model:r.model,score,harness:[r.agent,r.agentVersion].filter(Boolean).join(' '),setting:effort,
        cost:r.cost_per_checkpoint,metrics:{publishedRank:r.rank,strictSolve:r.pct_checkpoints_solved,coreSolve:r.pct_checkpoints_core_solved,erosion:r.erosion_mean,verbosity:r.verbosity_mean}});
    }
    const seen=new Set<string>();return rows.filter(r=>{const key=JSON.stringify([r.model,r.harness,r.setting]);if(seen.has(key))return false;seen.add(key);return true;});
  },
};
export default board;
