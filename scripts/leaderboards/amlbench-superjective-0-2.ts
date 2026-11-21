// AMLBench measures escalation sensitivity on reportable alerts. Its results page plots three full-spec conditions for models that clear the specificity gate.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://amlbench.com/";

interface Point { name: string; base: number; attack: number; deception: number }

const board: Leaderboard = {
  benchmark: "amlbench-superjective-0-2",
  url: "https://amlbench.com/",
  feed: FEED,
  terms: "The repository states Apache 2.0. https://github.com/burnssa/amlbench/blob/master/LICENSE The site returns a 404 page for robots.txt.",
  async fetch() {
    const page = await fetchText(FEED);
    const marker = /const MODELS\s*=\s*(?=\[)/.exec(page);
    if (!marker) throw new Error('Missing AMLBench chart');
    const points = jsLiteral<Point[]>(page, marker.index + marker[0].length);
    if (points.length < 6) throw new Error('Expected six qualifying models');
    const conditions = { base: 'Baseline (no stressor)', attack: '+ prompt attack', deception: '+ deceptive cover (A2)' } as const;
    return points.flatMap((p) => Object.entries(conditions).map(([key, setting]) => {
      const score = p[key as keyof typeof conditions];
      if (!p.name || !Number.isFinite(score)) throw new Error(`Missing ${setting} score for ${p.name}`);
      return { model: p.name, score, setting, trials: 1 };
    }));
  },
};
export default board;
