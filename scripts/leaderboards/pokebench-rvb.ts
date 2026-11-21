// PokéBench counts the furthest milestone reached from game screenshots and button presses. Its runs file records the turn at each milestone, including the turn used to break ties.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://pokebench.tv/runs.json";
const board: Leaderboard = {
  benchmark: "pokebench-rvb",
  url: "https://pokebench.tv/?category=rvb",
  feed: FEED,
  terms: "The repository uses the MIT license. It excludes the game ROM. https://raw.githubusercontent.com/VibeCodyH/pokebench/main/LICENSE The host has no published robots directives at /robots.txt.",
  costPer: 'run',
  parts: {
  "left_house": {
    "name": "Left the house",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "got_starter": {
    "name": "Got a starter",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "route_1": {
    "name": "Reached Route 1",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "viridian_city": {
    "name": "Reached Viridian City",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "got_parcel": {
    "name": "Got Oak's Parcel",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "got_pokedex": {
    "name": "Got the Pok\u00e9dex",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "viridian_forest": {
    "name": "Entered Viridian Forest",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "pewter_city": {
    "name": "Reached Pewter City",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "pewter_gym": {
    "name": "Entered Brock's Gym",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  },
  "beat_brock": {
    "name": "Beat Brock (Boulder Badge)",
    "group": "Turn reached",
    "unit": "score",
    "better": "lower"
  }
},
  async fetch() {
    type Run = { category: string; display_name: string; think_level?: string; run_date: string; prompt_version: string; harness_version: number;
      cost_usd?: number; tokens_out?: number; tokens_in?: number; youtube_url?: string; turns_used: number; furthest_index: number;
      wall_time_s?: number; milestones: { key: string; turn: number }[] };
    const runs = (await fetchJson<Run[]>(FEED)).filter(r => r.category === 'rvb');
    if (runs.length < 19) throw new Error('Missing raw vision runs');
    return runs.map(r => {
      const score = r.furthest_index + 1;
      if (!r.display_name || !Number.isInteger(score) || score < 0 || score > 10 || !Number.isFinite(r.turns_used)) throw new Error('Invalid raw vision run');
      const metrics: Record<string,number> = { turns: r.turns_used };
      for (const m of r.milestones) if (Number.isFinite(m.turn)) metrics[m.key] = m.turn;
      if (r.wall_time_s != null) metrics.seconds = r.wall_time_s;
      if (r.tokens_in != null) metrics.inputTokens = r.tokens_in;
      return { model: r.display_name, setting: [r.prompt_version, 'harness v' + r.harness_version, r.think_level].filter(Boolean).join(', '),
        date: r.run_date, score, cost: r.cost_usd ?? undefined, tokens: r.tokens_out ?? undefined, link: r.youtube_url || undefined, metrics };
    });
  },
};
export default board;
