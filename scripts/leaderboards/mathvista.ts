// MathVista (testmini, 1,000 problems). mathvista.github.io draws its leaderboard from
// data/results/model_scores.js, a script that assigns one JSON object, score_table: per entry the model,
// method (LLM, LMM, tool-augmented or reasoning), source link, date, ALL (the overall accuracy, 0 to 100)
// and per-task scores. ALL is the score. The object is read as data (JSON after the assignment), never run.
// The human and random-chance baselines are dropped, and the medal emoji on the top three are removed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = 'https://mathvista.github.io/data/results/model_scores.js';

interface Entry {
  [key: string]: string | number | undefined;
  Model?: string;
  Method?: string;
  Date?: string;
  ALL?: number | string;
}

const board: Leaderboard = {
  benchmark: 'mathvista',
  url: 'https://mathvista.github.io/#leaderboard',
  feed: `${FEED} (ALL, testmini)`,
  terms: 'Static data file on the MathVista GitHub Pages site; the MathVista repository is CC BY-SA 4.0.',
  aliases: {
    'OpenAI o1': 'o1',
    'Qwen2VL-72B': 'qwen2-vl-72b-instruct',
    'Pixtral Large (124B)': 'pixtral-large',
    'Doubao-pro-1.5': 'doubao-1-5-pro',
    'GPT-4T 2024-04-09': 'gpt-4-turbo-apr-2024',
    'GPT-4V (Playground)': 'gpt-4v',
    'MiniCPM-V-2 (2.8B)': 'minicpm-v-2',
    'Phi-3.5-Vision 4.2B': 'phi-3-5-vision-instruct',
    'Phi-4-multimodal-ins': 'phi-4-multimodal',
    'Phi-3-Vision-128K-In': 'phi-3-vision-128k-instruct',
  },
  async fetch() {
    const table = jsonAfter<Record<string, Entry>>(await fetchText(FEED), 'score_table =');
    const rows: LeaderboardRow[] = [];
    for (const e of Object.values(table)) {
      const model = e.Model?.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      if (!model || typeof e.ALL !== 'number' || /human|random|frequent guess/i.test(model)) continue;
      const metrics = Object.fromEntries(Object.entries(e).filter(([key, value]) => key !== 'ALL' && typeof value === 'number' && Number.isFinite(value))) as Record<string, number>;
      rows.push({ model, score: e.ALL, date: /^\d{4}-\d\d-\d\d$/.test(e.Date ?? '') ? e.Date : undefined, ...(Object.keys(metrics).length ? { metrics } : {}) });
    }
    if (!rows.length) throw new Error('no rows in score_table');
    return rows;
  },
};
export default board;
