// LADDER (INSAIT). ladderrobotics.ai (formerly ladder.insait.ai) embeds its leaderboard data as JSON in a
// <script id="lb-data" type="application/json"> tag: per system the scaffold name ("GPT-Policy", "VoLo",
// "PSP-Agent"), the vision-language model that drives it, the low-level policy, evaluation dates, task
// count, mean task completion over the 145 tasks (the board's ranking), and cost per episode. A row is kept
// when a model drives it: the model is the row's model and the scaffold its harness. Policy-only rows
// (Bridge / π0.5 with rule-based triggers) and the privileged reference are skipped. Systems scored only on
// the 10-task LADDER-Lite subset are excluded from this full 145-task benchmark. The
// last evaluation day is the run date. The table's other columns go in `metrics`: the ± on Success ("pm",
// points), "Subgoals done (%)" ("progress") and "Cost per completed task" ("costSuccess", US dollars).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://ladderrobotics.ai/';

interface System {
  name: string;
  vlm?: string;
  type?: string;
  evaluated?: string[];
  mean?: { v?: number; pm?: number | null };
  progress?: { mean?: number | null };
  cost_ep?: number;
  cost_succ?: number | null;
}

const board: Leaderboard = {
  benchmark: 'ladder-robotics',
  url: PAGE,
  feed: `${PAGE} (inline JSON #lb-data, systems[].mean)`,
  chart:{title:'Success versus episode cost',x:{key:'cost',label:'Cost per episode',unit:'$',better:'lower'},y:{key:'score',label:'Success',unit:'%',better:'higher'}},
  terms: 'Public leaderboard page; robots.txt allows all paths and the site states no terms.',
  async fetch() {
    const html = await fetchText(PAGE);
    const json = html.match(/<script[^>]*id="lb-data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!json) throw new Error('no lb-data on the LADDER page');
    const data = JSON.parse(json) as { systems: System[]; lite?: { systems: System[] } };
    const rows: LeaderboardRow[] = [];
    const seen = new Set<string>();
    const add = (s: System, setting?: string) => {
      const score = s.mean?.v;
      if (s.type === 'Reference' || typeof score !== 'number') return;
      const metrics: Record<string, number> = {};
      if(typeof s.cost_ep==='number')metrics.cost=s.cost_ep;
      if (typeof s.mean?.pm === 'number') metrics.pm = s.mean.pm;
      if (typeof s.progress?.mean === 'number') metrics.progress = s.progress.mean;
      if (s.cost_succ != null) metrics.costSuccess = s.cost_succ;
      rows.push({
        model: s.vlm || s.name,
        harness: s.name,
        score,
        setting,
        date: s.evaluated?.at(-1),
        cost: s.cost_ep,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
      seen.add(`${s.name}|${s.vlm}`);
    };
    for (const s of data.systems) add(s);

    return rows;
  },
};
export default board;
