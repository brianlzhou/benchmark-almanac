// AlpacaEval 2.0 (Stanford Tatsu Lab). tatsu-lab.github.io/alpaca_eval/ draws its board from a CSV in the
// alpaca_eval repository: name, length_controlled_winrate, win_rate, avg_length, link, samples and filter.
// The length-controlled win rate against GPT-4 Turbo (0 to 100) is the headline the page and model cards
// use, so it is the score. All published configurations are kept, including community and adversarial
// submissions, with the feed's filter label in setting. Unspecified GPT-4 snapshots stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/tatsu-lab/alpaca_eval/main/docs/data_AlpacaEval_2/weighted_alpaca_eval_gpt4_turbo_leaderboard.csv';

const board: Leaderboard = {
  benchmark: 'alpacaeval-2-0',
  harnesses: 'system',
  verified: 'listed in the verified submission group',
  url: 'https://tatsu-lab.github.io/alpaca_eval/',
  feed: `${FEED} (length_controlled_winrate, all submission groups)`,
  terms: 'CSV in the tatsu-lab/alpaca_eval repository, which is Apache-2.0.',
  aliases: {
    // "(MM/DD)" names the API snapshot
    'GPT-4 Omni (05/13)': 'gpt-4o-may-2024',
    'GPT-4 Turbo (04/09)': 'gpt-4-turbo-apr-2024',
    'GPT-4o Mini (07/18)': 'gpt-4o-mini',
    'GPT-4 Preview (11/06)': 'gpt-4-turbo-nov-2023',
    'GPT-4 (03/14)': 'gpt-4-mar-2023',
    'GPT 3.5 Turbo (06/13)': 'gpt-3-5-turbo-jun-2023',
    'GPT 3.5 Turbo (11/06)': 'gpt-3-5-turbo-nov-2023',
    'Claude 3 Opus (02/29)': 'claude-3-opus',
    'Claude 3 Sonnet (02/29)': 'claude-3-sonnet',
    'Mistral Large (24/02)': 'mistral-large',
    'Llama 3.1 405B Instruct': 'llama-3-1-405b',
    'Llama 3.1 70B Instruct': 'llama-3-1-70b',
    'Llama 3.1 8B Instruct': 'llama-3-1-8b',
    'Llama 3 70B Instruct': 'llama-3-70b',
    'Llama 3 8B Instruct': 'llama-3-8b',
    'LLaMA2 Chat 70B': 'llama-2-70b',
    'LLaMA2 Chat 13B': 'llama-2-13b',
    'LLaMA2 Chat 7B': 'llama-2-7b',
    'Mixtral 8x22B v0.1': 'mixtral-8x22b',
    'DBRX Instruct': 'dbrx',
    'Yi 34B Chat': 'yi-34b',
    'Gemma Instruct (7B)': 'gemma-7b',
    'Gemma Instruct (2B)': 'gemma-2b',
    'Falcon 40B Instruct': 'falcon-40b',
    'Falcon 7B Instruct': 'falcon-7b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.length_controlled_winrate);
      // plain "GPT-4" does not say which snapshot ran ("GPT-4 (06/13)" and "GPT-4 (03/14)" are separate rows)
      if (!r.name || !r.length_controlled_winrate.trim() || !Number.isFinite(score)) continue;
      const name = r.name.trim();
      const row: LeaderboardRow = {
        model: name === 'GPT-4' ? 'GPT-4 (snapshot unspecified)' : name,
        score,
        setting: r.filter || 'unclassified submission',
        verified: r.filter === 'verified' ? true : undefined,
        link: r.samples?.startsWith('https://') ? r.samples : undefined,
      };
      const aligner = name.match(/^Aligner 2B\+(.+)$/);
      const pair = name.match(/^PairRM 0\.4B\+(.+) \(best-of-16\)$/);
      const self = name.match(/^SelfMoA \+ (.+)$/);
      if (aligner || pair) {
        row.model = (aligner ?? pair)![1];
        row.harness = aligner ? 'Aligner' : 'PairRM';
        row.models = [row.model, aligner ? 'Aligner 2B' : 'PairRM 0.4B'];
        if (pair) row.setting += '; best-of-16';
      } else if (self) {
        row.model = self[1];
        row.harness = 'SelfMoA';
      } else if (name === 'OpenPipe MoA GPT-4 Turbo') {
        row.model = 'GPT-4 Turbo';
        row.harness = 'OpenPipe MoA';
      }
      rows.push(row);
    }
    if (!rows.length) throw new Error('no verified rows in the AlpacaEval 2.0 CSV');
    return rows;
  },
};
export default board;
