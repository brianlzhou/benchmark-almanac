// Realtime-Bench. realtimeagents.org draws its leaderboard in the browser. The page's script bundle,
// /assets/index-<hash>.js, holds each configuration's first three Wall Clock runs of every task as a JSON string,
// `km=JSON.parse(`{"gpt-6-astra--high":{"tasks":{"task":[1,1,0],...},"entry":{name, effort, latencyMean, ...}}}`)`,
// and the date it was retrieved (`vm="2026-10-14"`). The bundle's file name changes with each release, so the
// home page is read first to find it. The bundle is read as text, never run.
//
// The headline score is pass^1, the average success over the three runs, the board's default and the paper's
// Table 3. Each row also carries pass^3 (the share of tasks solved in all three runs) and the mean decision
// latency in seconds, which the board's Pareto chart plots against each other. Jev ran the 30 web tasks only,
// and is excluded from the full-benchmark leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://realtimeagents.org/';

interface Config {
  tasks: Record<string, (number | null)[]>;
  entry: { name: string; effort?: string; latencyMean?: number; scope?: string; harnesses?: string[] };
}

const board: Leaderboard = {
  benchmark: 'realtime-bench',
  url: 'https://realtimeagents.org/#/leaderboard',
  feed: `${PAGE}assets/index-<hash>.js (the configurations JSON: three Wall Clock runs per task, and latency)`,
  terms: 'realtimeagents.org publishes no robots.txt or terms, and the project code is MIT-licensed (github.com/RealtimeAgents/Realtime-Bench).',
  aliases: {},
  chart: {
    title: 'Latency and pass^3 under Wall Clock',
    note: 'Each point is one model at one reasoning effort. Pass^3 is the share of tasks solved in all three runs, so it rewards consistency.',
    x: { key: 'latency', label: 'Mean decision latency', unit: 's', better: 'lower' },
    y: { key: 'pass3', label: 'pass^3', unit: '%', better: 'higher' },
  },
  async fetch() {
    const home = await fetchText(PAGE);
    const asset = home.match(/\/assets\/index-[\w-]+\.js/)?.[0];
    if (!asset) throw new Error('no script bundle linked from the home page');
    const js = await fetchText(new URL(asset, PAGE).href);
    // Select the configurations by their schema, not a minifier's variable name.
    let configs: Record<string, Config> | undefined;
    let date: string | undefined;
    for (const m of js.matchAll(/JSON\.parse\(`((?:\\.|[^`\\])*)`\)/g)) {
      const value = JSON.parse(m[1].replace(/\\\\/g, '\\').replace(/\\`/g, '`'));
      if (!value || Array.isArray(value) || typeof value !== 'object') continue;
      const entries = Object.values(value) as Config[];
      if (!entries.length || !entries.every(c => c?.tasks && c?.entry?.name)) continue;
      configs = value;
      date = js.slice(Math.max(0, m.index! - 120), m.index).match(/="(\d{4}-\d{2}-\d{2})",[^,=]+=\s*$/)?.[1];
      break;
    }
    if (!configs) throw new Error('no configurations in the bundle');
    const rows: LeaderboardRow[] = [];
    for (const c of Object.values(configs)) {
      // Exclude the incomplete web-only cohort.
      if(c.entry.scope==='web-only'||Object.keys(c.tasks).length!==50)continue;

      const runs = Object.values(c.tasks).filter((t) => t.length === 3 && t.every((x) => x === 0 || x === 1)) as number[][];
      if (!runs.length || runs.length < Object.keys(c.tasks).length) continue;
      const pass1 = (100 * runs.reduce((n, t) => n + (t[0] + t[1] + t[2]) / 3, 0)) / runs.length;
      const pass3 = (100 * runs.filter((t) => t[0] + t[1] + t[2] === 3).length) / runs.length;
      const effort = c.entry.effort && !/^(fixed|official|default)$/i.test(c.entry.effort) ? c.entry.effort : undefined;
      rows.push({
        model: c.entry.name,
        score: pass1,
        setting: effort,
        harness: c.entry.harnesses?.length ? `Realtime-Bench revisions: ${c.entry.harnesses.join(', ')}` : undefined,
        date,
        metrics: { pass3, ...(c.entry.latencyMean ? { latency: c.entry.latencyMean } : {}) },
      });
    }
    if (rows.length < 5) throw new Error(`only ${rows.length} configurations with three runs`);
    return rows;
  },
};
export default board;
