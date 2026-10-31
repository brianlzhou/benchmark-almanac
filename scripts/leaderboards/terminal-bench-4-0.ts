// Terminal-Bench 4.0. tbench.ai renders every Terminal-Bench leaderboard from the Harbor Hub registry: its
// client POSTs {package, name} to a public Supabase edge function, leaderboard-read, and gets back the
// board's columns plus every row (metadata: agent, model, effort, date; metrics: accuracy 0 to 100).
// The other versions (2.0, 2.1, 3.0) import makeTerminalBench from this file.
//
// The site shows the best effort per agent and model by default, with an "all efforts" toggle. Every
// effort is kept here, with the effort in `setting`, so the almanac can pick.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://ofhuhcpkvzjlejydnvyd.supabase.co/functions/v1/leaderboard-read';

type Link = string | { label?: string; url?: string };
interface Row {
  status?: string;
  metadata: {
    agent_display?: Link;
    model_display?: Link;
    model_names?: string[];
    reasoning_effort?: string;
    date?: string;
    release_date?: string;
  };
  metrics: { accuracy?: number };
}

const label = (l?: Link) => (typeof l === 'string' ? l : l?.label)?.trim();

/** One board in the registry: package "terminal-bench/terminal-bench", leaderboard name "4-0-0". */
export function makeTerminalBench(opts: {
  benchmark: string;
  version: string;
  pkg: string;
  name: string;
  aliases?: Record<string, string>;
}): Leaderboard {
  return {
    benchmark: opts.benchmark,
    url: `https://www.tbench.ai/?version=${opts.version}`,
    feed: `${FEED} (POST {"package":"${opts.pkg}","name":"${opts.name}"})`,
    terms:
      'Public, unauthenticated Harbor Hub endpoint that tbench.ai itself calls, under the Harbor Hub Terms of Service; the Terminal-Bench repository is Apache-2.0.',
    aliases: opts.aliases,
    async fetch() {
      const body = JSON.stringify({ package: opts.pkg, name: opts.name });
      const res = JSON.parse(
        await fetchText(FEED, { method: 'POST', headers: { 'content-type': 'application/json' }, body }),
      ) as { leaderboard: { title: string }; rows: Row[] };
      const out: LeaderboardRow[] = [];
      for (const r of res.rows) {
        if (r.status && r.status !== 'display') continue;
        const model = label(r.metadata.model_display);
        // "Multiple" marks agents that route between models; there is no one model to credit
        if (!model || /^multiple$/i.test(model)) continue;
        out.push({
          model,
          score: Number(r.metrics.accuracy),
          setting: r.metadata.reasoning_effort?.toLowerCase() || undefined,
          harness: label(r.metadata.agent_display),
          date: r.metadata.date ?? r.metadata.release_date,
        });
      }
      return out;
    },
  };
}

export default makeTerminalBench({
  benchmark: 'terminal-bench-4-0',
  version: '4.0',
  pkg: 'terminal-bench/terminal-bench',
  name: '4-0-0',
});
