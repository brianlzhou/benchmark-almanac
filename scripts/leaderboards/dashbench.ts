// DashBench evaluates descriptions of dashcam corner cases. Its project page ranks models by Avg across prompts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://cornercase-dashbench.github.io/static/js/data.js?v=18";

const parts = { Q1: 'Q1 (Unusual)', Q2: 'Q2 (Dangerous)', Q3: 'Q3 (Describe)', Q4R: 'Q4R (Reasoning)', Q5: 'Q5 (Definition-guided)', Q4TF: 'Q4TF (Detection)' };
type Result = {model: string; family: string; Avg: number} & Record<keyof typeof parts, number | null>;

const board: Leaderboard = {
  benchmark: "dashbench",
  url: "https://cornercase-dashbench.github.io/#leaderboard",
  feed: FEED,
  terms: "The page credits CC BY-SA 4.0 for its template and identifies separate clip sources. It gives no separate score license. https://cornercase-dashbench.github.io/",
  parts,
  aliases: {
    "InternVL3.5 (241B)": "internvl3-5-241b-a28b",
    "GLM-4.1V-Thinking (9B)": "glm-4-1v-9b-thinking",
    "VITA-1.5 (8B)": "vita-1-5",
    "MiniCPM4.5 (8B)": "minicpm-v-4-5",
    "Qwen3-VL (235B)": "qwen3-vl-235b-a22b"
  },
  async fetch() {
    const data = jsonAfter<Result[]>(await fetchText(FEED), 'const LEADERBOARD =');
    if (data.length < 25) throw new Error('DashBench: expected at least 25 models');
    return data.map((r): LeaderboardRow => {
      if (!r.model || !Number.isFinite(r.Avg)) throw new Error('Missing DashBench average');
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(parts) as (keyof typeof parts)[]) {
        if (!(key in r)) throw new Error('Missing DashBench column ' + key);
        if (r[key] !== null) metrics[key] = r[key];
      }
      return {model: r.model, score: r.Avg, metrics, open: r.family === 'Specialist' ? undefined : r.family === 'Open-source'};
    });
  },
};
export default board;
