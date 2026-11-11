// Misguided Attention. cpldcpu.github.io/MisguidedAttention draws its heatmap from data.js
// (`const allData = {...}`): per prompt and model the average_total_score (0 to 1) over its evaluations.
// The page ranks models by their average over the prompts they have a score on (script.js,
// processInitialData), shown as a percent; this importer repeats that mean and scales it to 0 to 100.
// Model keys are API ids ("gpt-4o-2024-11-20", "claude-4-sonnet-0522-thinking"). A thinking suffix
// ("-think", "-thk", ":thinking", "-thinking-4k") becomes the setting thinking and "-nothink" the setting
// non-thinking. Dated or renamed ids the resolver would misplace are aliased; the data last changed on
// 2025-07-31, so undated Gemini 2.5 names are the June 2025 releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://cpldcpu.github.io/MisguidedAttention/';
const FEED = `${PAGE}data.js`;

const board: Leaderboard = {
  benchmark: 'misguided-attention',
  url: PAGE,
  feed: `${FEED} (mean average_total_score per model)`,
  terms: 'Static data script on the project GitHub Pages site (robots.txt allows all); the MisguidedAttention repository is CC0-1.0.',
  aliases: {
    'gpt-4o-2024-11-20': 'gpt-4o-nov-2024',
    'gpt-4o-20250129': 'gpt-4o-jan-2025',
    // the board also lists deepseek-r1-0528 and deepseek-chat-v3-0324, so the plain names are the first releases
    'deepseek-r1': 'deepseek-r1',
    'DeepSeek-V3': 'deepseek-v3',
    'deepseek-chat-v3-0324': 'deepseek-v3-mar-2025',
    'gemini-2.5-pro-preview-03-25': 'gemini-2-5-pro-mar-2025',
    'gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
    'gemini-2.5-pro': 'gemini-2-5-pro-jun-2025',
    'gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash-may-2025',
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
    'claude-4-sonnet-0522': 'claude-sonnet-4',
    'claude-3.7': 'claude-3-7-sonnet',
    'command-a-03-2025': 'cohere-command-a',
    'glm-z1-32b': 'glm-z1-32b-0414',
    'minimax-01': 'minimax-text-01',
    'mistral-small-3.1-2503': 'mistral-small-3-1',
    'olmo-2-0325-32b': 'olmo-2-32b-instruct',
    'll3.3-nemotron-49b-v1': 'llama-3-3-nemotron-super-49b-v1',
    // in the first half of 2025 the qwen-max API served Qwen2.5-Max
    'qwen-max': 'qwen2-5-max',
  },
  async fetch() {
    const data = jsonAfter<Record<string, Record<string, { average_total_score?: number }>>>(await fetchText(FEED), 'const allData =');
    const sums = new Map<string, { s: number; n: number }>();
    for (const byModel of Object.values(data)) {
      for (const [model, r] of Object.entries(byModel)) {
        if (typeof r?.average_total_score !== 'number' || Number.isNaN(r.average_total_score)) continue;
        const a = sums.get(model.trim()) ?? { s: 0, n: 0 };
        a.s += r.average_total_score;
        a.n++;
        sums.set(model.trim(), a);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [name, a] of sums) {
      // Every measured source snapshot remains, including the earlier beta.
      if (!a.n) continue;
      let model = name;
      let setting: string | undefined;
      const think = name.match(/(?:-|:)(?:thk|think|thinking)(?:-\w+)?$/i);
      if (think) [model, setting] = [name.slice(0, think.index), 'thinking'];
      else if (/-nothink$/i.test(name)) [model, setting] = [name.replace(/-nothink$/i, ''), 'non-thinking'];
      if (name === 'grok-3-mini-beta-think') model = 'Grok 3 Mini beta (unlisted snapshot)';
      rows.push({ model, setting, score: Number(((100 * a.s) / a.n).toFixed(1)) });
    }
    return rows;
  },
};
export default board;
