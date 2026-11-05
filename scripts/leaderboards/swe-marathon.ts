// SWE-Marathon v1.0 (Abundant AI), the archived board. swe-marathon.org keeps the v1.0 leaderboard as a
// static array in its Vite bundle (/assets/index-<hash>.js), the one that starts `[{rank:`Ref`,id:`oracle``:
// per agent and model, pass1 (pass@1 over 100 trials, 0 to 100, the ranking), the mean trial cost in US
// dollars and token counts. pass1 is the score. The Oracle and NOP reference rows are skipped, and the
// scaffold (agent) name, without its version, is the harness. Metrics: partialAvg, the mean uncalibrated
// partial score (0 to 100), as `partial`, and tokAvg, the mean tokens of all kinds per trial in millions (not
// output tokens alone), as `tokensM`. The v1.1 board is swe-marathon-1-1.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { SWEM_PAGE, SWEM_TERMS, backtickLiteral, swemBundle } from './swe-marathon-1-1.ts';

interface Entry {
  name: string;
  scaffold: string;
  ref?: boolean;
  pass1: number | null;
  costAvg: number | null;
  partialAvg?: number | null;
  tokAvg?: number | null;
}

const board: Leaderboard = {
  benchmark: 'swe-marathon',
  url: SWEM_PAGE,
  feed: `${SWEM_PAGE}assets/index-<hash>.js (v1.0 archive leaderboard array, pass1)`,
  terms: SWEM_TERMS,
  aliases: {
    'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  },
  async fetch() {
    const { js } = await swemBundle();
    const at = js.search(/\[\{rank:`Ref`,id:`oracle`/);
    if (at < 0) throw new Error('v1.0 leaderboard array not found in the SWE-Marathon bundle');
    const list = backtickLiteral<Entry[]>(js, at);
    const rows: LeaderboardRow[] = [];
    for (const e of list) {
      if (e.ref || typeof e.pass1 !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof e.partialAvg === 'number') metrics.partial = e.partialAvg;
      if (typeof e.tokAvg === 'number') metrics.tokensM = e.tokAvg;
      rows.push({
        model: e.name,
        score: e.pass1,
        harness: e.scaffold.replace(/\s+v\d[\d.]*$/, ''),
        cost: e.costAvg ?? undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
