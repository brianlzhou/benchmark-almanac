// CharXiv (reasoning questions, validation split). charxiv.github.io renders data/val_result.csv with
// csv_to_html_table, sorted by its fourth column: the Reasoning "Overall" (the second "Overall" column is
// the Descriptive split). Cards report the reasoning split, so that is the score here. The human and
// random baselines (weight "N/A") are skipped. Not updated since April 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://charxiv.github.io/data/val_result.csv';

const board: Leaderboard = {
  benchmark: 'charxiv',
  url: 'https://charxiv.github.io/#leaderboard',
  feed: `${FEED} (Reasoning Overall)`,
  terms: 'Static CSV on the CharXiv GitHub Pages site, which states no terms; the CharXiv code is Apache-2.0 and the dataset CC BY-SA 4.0.',
  aliases: {
    'GPT-4o 240513': 'gpt-4o-may-2024',
    'GPT-4o 241120': 'gpt-4o-nov-2024',
    // evaluated in June 2024, before the October update
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet',
    'GPT 4.1': 'gpt-4-1',
    'GPT 4.5': 'gpt-4-5',
    'GPT 4.1 mini': 'gpt-4-1-mini',
    'GPT 4.1 nano': 'gpt-4-1-nano',
    'Qwen2-VL 72B': 'qwen2-vl-72b-instruct',
    'Qwen2-VL 7B': 'qwen2-vl-7b-instruct',
    'Phi-3.5 Vision': 'phi-3-5-vision-instruct',
    'Llava OneVision 72B': 'llava-onevision-72b',
    'InternVL V2.5 78B': 'internvl2-5-78b',
    // the paper's June 2024 runs, before the September updates
    'Gemini 1.5 Pro': 'gemini-1-5-pro-may-2024',
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
    'Llama 3.2 Vision 11B': 'llama-3-2-11b',
    'Llama 3.2 Vision 90B': 'llama-3-2-90b',
  },
  async fetch() {
    const csv = await fetchText(FEED);
    // the header repeats "Overall" (reasoning, then descriptive), so name the columns by position
    const [head, ...rest] = csv.split(/\r?\n/);
    const cols = head.split(',');
    if (cols[3] !== 'Overall' || cols[0] !== 'Model') throw new Error(`unexpected CharXiv header: ${head}`);
    const named = cols.map((c, i) => (i === 3 ? 'Reasoning' : i === 8 ? 'Descriptive' : c)).join(',');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv([named, ...rest].join('\n'))) {
      if (r.Weight === 'N/A') continue;
      const score = Number(r.Reasoning);
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model.trim(), score });
    }
    return rows;
  },
};
export default board;
