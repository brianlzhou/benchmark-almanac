// MindBench ranks answers to 610 mental health conversations by the mean of its three model judges.
// The v1 matrix lists each judge’s clipped mean for each candidate.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/mindbench-ai/healthbench-psych/main/eval/runs/matrix_healthbench-psych-v1.csv";
const board: Leaderboard = {
  benchmark: 'healthbench-psych',
  url: "https://github.com/mindbench-ai/healthbench-psych/blob/main/eval/runs/matrix_healthbench-psych-v1.csv",
  feed,
  terms: "The raw file host has no robots.txt. MindBench.ai uses the MIT license. Vendored HealthBench materials retain their original MIT terms. https://github.com/mindbench-ai/healthbench-psych#license",
  stats: {
    haiku: { name: 'Claude Haiku judge score', unit: 'score', better: 'higher', note: 'Clipped mean score from 0 to 1.' },
    gemini: { name: 'Gemini judge score', unit: 'score', better: 'higher', note: 'Clipped mean score from 0 to 1.' },
    gpt41: { name: 'Generative pre-trained transformer 4.1 judge score', unit: 'score', better: 'higher', note: 'Clipped mean score from 0 to 1.' },
    prompts: { name: 'Prompts', unit: 'count' },
  },
  async fetch() {
    const judges = ['claude-haiku-4-5-20251001','gemini-2.5-flash','gpt-4.1-2025-04-14'];
    const models = new Map<string, Map<string,number>>();
    for (const r of parseCsv(await fetchText(feed))) {
      if (!r.candidate || !judges.includes(r.judge) || !r.clipped_mean_score?.trim() || !Number.isFinite(Number(r.clipped_mean_score)) || Number(r.n_prompts) !== 610)
        throw new Error('Invalid HealthBench-Psych v1 matrix row');
      const scores = models.get(r.candidate) ?? new Map<string,number>();
      if (scores.has(r.judge)) throw new Error('Duplicate judge for ' + r.candidate);
      scores.set(r.judge,Number(r.clipped_mean_score));
      models.set(r.candidate,scores);
    }
    if (models.size < 23) throw new Error('Missing HealthBench-Psych candidates');
    return [...models].map(([model,scores]) => {
      if (scores.size !== 3) throw new Error('Missing judge for ' + model);
      const [haiku,gemini,gpt41] = judges.map(j=>scores.get(j)!);
      return { model, score: (haiku + gemini + gpt41)/3, metrics: { haiku, gemini, gpt41, prompts: 610 } };
    });
  },
};
export default board;
