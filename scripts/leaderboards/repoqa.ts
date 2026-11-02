// RepoQA (EvalPlus), "Search Needle Function" over long code repositories. evalplus.github.io/repoqa.html
// loads results/repoqa/COMBINED-RESULTS.json: per model an eval date, context size and pass@1 (a fraction)
// for each language and for "all", at similarity thresholds from 0.0 to 1.0. The page shows the 0.8
// threshold and ranks by the "all" column (Avg.), so all at 0.8 × 100 is the score. Names keep only the part
// after the Hugging Face organization, as the page does. The eval date goes to the resolver.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://evalplus.github.io/results/repoqa/COMBINED-RESULTS.json';

interface Entry {
  eval_date?: string;
  scores?: Record<string, Record<string, { 'pass@1'?: number }>>;
}

const board: Leaderboard = {
  benchmark: 'repoqa',
  url: 'https://evalplus.github.io/repoqa.html',
  feed: `${FEED} (all, threshold 0.8)`,
  terms: 'Static JSON on the EvalPlus GitHub Pages site; the repoqa repository is Apache-2.0.',
  aliases: {
    'Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
    'DeepSeek-V2-Chat': 'deepseek-v2-moe-236b-may-2024',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
    'CodeLlama-34b-Instruct-hf': 'codellama-34b-instruct',
  },
  async fetch() {
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const [id, e] of Object.entries(data)) {
      const v = e.scores?.all?.['0.8']?.['pass@1'];
      const model = id.split('/').pop()!;
      // the April 2024 Command R+ (the registry has only the August 2024 release)
      if (typeof v !== 'number' || model === 'c4ai-command-r-plus') continue;
      rows.push({ model, score: Number((v * 100).toFixed(1)), date: e.eval_date?.slice(0, 10) });
    }
    if (!rows.length) throw new Error('no scores in COMBINED-RESULTS.json');
    return rows;
  },
};
export default board;
