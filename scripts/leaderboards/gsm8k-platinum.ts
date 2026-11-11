// GSM8K-Platinum's full revised set has 1,209 questions. The official inspector
// publishes one array of errors per model configuration. Count those errors, then
// convert to accuracy. The older 268-question matrix has its own benchmark reader.
import type { Leaderboard } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
const PAGE = 'http://platinum-bench.csail.mit.edu/';
const FEED = PAGE + 'errors/errors_gsm8k_full.json';
const board: Leaderboard = {
  benchmark: 'gsm8k-platinum', url: PAGE, feed: FEED,
  terms: 'MIT publishes the result inspector publicly. Source licenses apply. The Almanac credits and links the source.',
  aliases: {
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'gemini-2.0-flash-thinking-01-21': 'gemini-2-0-flash-thinking-jan-2025',
    'gemini-2.0-pro-02-05': 'gemini-2-0-pro',
  },
  async fetch() {
    const card = await fetchText('https://huggingface.co/datasets/madrylab/gsm8k-platinum/resolve/main/README.md');
    if (!/num_examples: 1209\b/.test(card)) throw new Error('Full-set denominator changed');
    const data = await fetchJson<Record<string, unknown[]>>(FEED);
    const rows = Object.entries(data).map(([name, errors]) => {
      if (!Array.isArray(errors) || errors.length > 1209) throw new Error('Invalid full-set error list');
      let model = name, setting: string | undefined;
      const effort = model.match(/-(high|med|thinking)$/);
      if (effort) { setting = effort[1] === 'med' ? 'medium' : effort[1]; model = model.slice(0, -effort[0].length); }
      if (model === 'deepseek-r1' || model === 'gpt-4o-mini') model += ' (snapshot unspecified)';
      return {model, setting, score: (1209 - errors.length) / 1209 * 100, metrics: {errors: errors.length, questions: 1209}};
    });
    if (!rows.length) throw new Error('Full-set results missing');
    return rows;
  },
};
export default board;
