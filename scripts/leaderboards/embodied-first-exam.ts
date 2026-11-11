// Embodied First Exam. www.embodied-first-exam.ai is a client-rendered page that reads data/exam.json. Its
// leaderboard section (leaderboard.shared) lists the ranked runs and, per view, solved and total tests; the
// standard, privileged and realtime views count different test sets. Use the page's default
// Standard view solve rate (percent); the other views remain supporting metrics. Each run in exam.json names the model, the coding-agent harness and the reasoning effort,
// plus an estimated spend over its attempts, which gives the cost per task, and its agent time over its
// attempts (agent_s / agent_n), the page's "Per attempt" minutes, kept as metrics.minutes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.embodied-first-exam.ai/';
const FEED = `${PAGE}data/exam.json`;

interface Exam {
  runs: { id: string; model: string; harness?: string; effort?: string; est_usd?: number; est_n?: number; agent_s?: number; agent_n?: number }[];
  leaderboard: { shared: { runs: string[]; views: Record<string, { scores: Record<string, [number, number, number?]> }> } };
}

const board: Leaderboard = {
  benchmark: 'embodied-first-exam',
  url: PAGE,
  feed: `${FEED} (leaderboard.shared.views.standard; default view)`,
  terms: 'Static JSON the site itself loads; robots.txt allows all paths and the site states no other terms.',
  aliases: { 'Kimi 3.1 Pro': 'kimi-k3-1-pro' },
  async fetch() {
    const exam = await fetchJson<Exam>(FEED);
    const views=exam.leaderboard?.shared?.views;if(!views)throw new Error('No exam views');
    const runs = new Map(exam.runs.map((r) => [r.id, r]));
    const rows: LeaderboardRow[] = [];
    for (const [view, data] of Object.entries(views)) for (const id of exam.leaderboard.shared.runs) {
      if(view!=='standard')continue;
      const run = runs.get(id);
      const s = data.scores[id];
      if (!run || !s || !s[1]) continue;
      rows.push({
        model: run.model,
        score: Number(((s[0] / s[1]) * 100).toFixed(2)),
        setting: [view,run.effort?.toLowerCase()].filter(Boolean).join('; '),
        harness: run.harness,
        cost: typeof run.est_usd==='number' && run.est_n ? run.est_usd / run.est_n : undefined,
        metrics: {...Object.fromEntries(Object.entries(views).filter(([k,v])=>k!==view&&v.scores[id]?.[1]>0).map(([k,v])=>[k,100*v.scores[id][0]/v.scores[id][1]])),solved:s[0],tests:s[1],...(typeof s[2]==='number'?{attempted:s[2]}:{}),...(run.agent_s && run.agent_n ? { minutes: run.agent_s / run.agent_n / 60 } : {})},
      });
    }
    if (rows.length < 3) throw new Error(`only ${rows.length} Embodied First Exam rows`);
    return rows;
  },
};
export default board;
