// RewardBench (v1, Ai2). The allenai/reward-bench Space now leads with RewardBench 2 and keeps the final v1
// board as leaderboard/final-rbv1-data.csv in its repository: per model the Score (weighted accuracy over
// Chat, Chat Hard, Safety, Reasoning and the prior sets, 0 to 100), its parts and the model type. Score is the
// score. Model cells are HTML links to the model page, so the link text is the name. A " ⚠️" flag marks
// models the board suspects of contamination and a " *" marks other footnoted rows, and both flags are dropped
// and the rows kept, as the page keeps them.
// RewardBench 2 is rewardbench-2.ts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://huggingface.co/spaces/allenai/reward-bench/resolve/main/leaderboard/final-rbv1-data.csv';

const board: Leaderboard = {
  benchmark: 'rewardbench',
  url: 'https://huggingface.co/spaces/allenai/reward-bench',
  feed: `${FEED} (Score)`,
  terms: 'CSV in the allenai/reward-bench Hugging Face Space, licensed Apache-2.0.',
  // keys without the vendor prefix, which the resolver drops before it looks up aliases a second time
  aliases: {
    'gemini-1.5-pro-0514': 'gemini-1-5-pro-may-2024',
    'gemini-1.5-pro-0924': 'gemini-1-5-pro-sept-2024',
    'gemini-1.5-flash-001': 'gemini-1-5-flash-may-2024',
    'Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'gemma-2-27b-it': 'gemma-2-27b',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'c4ai-command-r-plus': 'command-r-plus',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Score);
      const model = text(r.Model ?? '').replace(/\s*(⚠️?|\*)$/u, '').trim();
      if (!model || !Number.isFinite(score)) continue;
      // "openai/gpt-4o-2024-05-13": the date stamp picks the snapshot
      const stamp = model.match(/(20\d\d)-?(\d\d)-?(\d\d)$/);
      rows.push({ model, score, date: stamp ? `${stamp[1]}-${stamp[2]}-${stamp[3]}` : undefined });
    }
    return rows;
  },
};
export default board;
