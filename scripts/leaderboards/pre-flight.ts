// Pre-Flight tests knowledge of aviation operations and safety standards.
// Airside Labs ranks models by the percentage of questions answered correctly.
// Keep the uncertainty printed next to the score and distinguish local deployment settings.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWWfHX6LQdFGBEHzkDuF1yDJedQlc1YMnia4eEgaIEaMHL0ZCEQu0drKhqHsV_fgVM0EyanU284I_W/pub?gid=0&single=true&output=csv';
const board: Leaderboard = {
  benchmark: 'pre-flight', url: 'https://airsidelabs.com/ai-safety-eval-benchmark-results-latest', feed,
  terms: 'Airside Labs attributes the benchmark to Brooker and Hughes under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  aliases: {
    'NVIDIA Llama 3.1 Nemotron': 'llama-3-1-nemotron-70b-instruct',
    'DeepSeek V4 Pro': 'deepseek-v4-pro-0813', 'DeepSeek V4 Flash': 'deepseek-v4-flash-0731',
    'GPT-4o (Nov 2024)': 'gpt-4o-nov-2024', 'GPT-4o Mini (snapshot unspecified)': 'gpt-4o-mini',
    'GPT-3.5 Turbo (snapshot unspecified)': 'gpt-3-5-turbo-jan-2024', 'GPT-4 Preview (Jan 2024)': 'gpt-4-turbo-jan-2024',
    'Claude 3.5 Sonnet (Oct 2024)': 'claude-3-5-sonnet-october-2024', 'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'Llama 4 Scout 17B': 'llama-4-scout', 'Qwen QWQ 32B': 'qwq-32b', 'Mistral Large 2512': 'mistral-large-3',
    'Gemini 2.5 Pro (snapshot unspecified)': 'gemini-2-5-pro-jun-2025', 'Nemotron-3 Super 120B-A12B': 'nemotron-3-super',
  },
  async fetch() {
    const table = parseCsv(await fetchText(feed)).filter(r => r.task === 'Pre-flight');
    const rows = table.map(r => {
      const label = r.model_display_name;
      if (!label || !r.model || !r.score || !r.score_error) throw Error('Missing Pre-flight score or standard error');
      const name = label.replace(/\s*†$/, '');
      const deployment = name.match(/^(.*?)(?: (int4|FP8|AWQ|MXFP4|NVFP4))? \((local [^)]*|Groq)\)$/i);
      const setting = [deployment?.[2], deployment?.[3], label.endsWith('†') ? 'Prior evaluation' : undefined].filter(Boolean).join(', ');
      return { model: deployment?.[1] ?? name, setting: setting || undefined, score: 100 * Number(r.score),
        metrics: { stderr: 100 * Number(r.score_error) } };
    });
    return checked(rows, 78);
  },
};
export default board;
