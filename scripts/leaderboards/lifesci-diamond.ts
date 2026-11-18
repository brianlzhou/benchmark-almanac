// LifeSci Diamond: strict pass rate on the full set, with generation cost per task, from the makers'
// leaderboard.csv. Each row names its system ("Arca + GPT-6 Astra", "GPT-6 Astra API") and its model
// ("openai/gpt-6-astra") in separate columns. Arca's rows are Arca's own agent built on the model, so they show as
// their own entries and never count as the model's score. The API rows are the model on its own. "Arca + Auto"
// lets Arca pick the model, so it has no model to name. Graded-task counts and the mean on graded tasks (partial
// credit) go in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/arcainc/lifesci-diamond/main/leaderboard.csv';
const num = (s: string | undefined) => (s !== undefined && s.trim() !== '' && Number.isFinite(Number(s)) ? Number(s) : undefined);

const board: Leaderboard = {
  benchmark: 'lifesci-diamond',
  url: 'https://github.com/arcainc/lifesci-diamond',
  feed: FEED,
  terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
  reference: ['API'],
  harnesses: 'system',
  aliases: { 'meta/muse-wonder-1.0': 'muse-wonder' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = num(r.pass_pct);
      if (score === undefined || !r.system) continue;
      const arca = /^Arca \+ /.test(r.system);
      const low = num(r.pass_lower_pct);
      const high = num(r.pass_upper_pct);
      const metrics: Record<string, number> = {};
      for (const [k, v] of [['graded', r.graded], ['tasks', r.tasks], ['meanGraded', r.mean_on_graded]] as const) if (num(v) !== undefined) metrics[k] = num(v)!;
      rows.push({
        model: r.model === 'auto' ? 'Arca Auto' : r.model,
        score,
        harness: arca ? 'Arca' : 'API',
        ...(arca ? { agentOrg: 'Arca' } : {}),
        cost: num(r.cost_per_task_usd),
        // the file gives an interval; today its two ends equal the score, so it adds nothing yet
        ...(low !== undefined && high !== undefined && high > low ? { low, high } : {}),
        metrics,
      });
    }
    if (!rows.length) throw new Error('no LifeSci Diamond rows in leaderboard.csv');
    return rows;
  },
};
export default board;
