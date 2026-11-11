// SuperGPQA (ByteDance Seed and M-A-P). supergpqa.github.io is a static single-page app whose results ship
// inside its script bundle: one object per board, each model's entry written as JSON.parse('{...}') with
// overall and per-difficulty accuracy (0 to 1) under the prompt setting. The chat-model board is zero-shot
// and the base-model board is five-shot. The importer finds the bundle from the page, reads every entry that
// has a zero-shot or five-shot block (as data, never run) and keeps its overall accuracy × 100.
// Base checkpoints get an explicit suffix so the resolver cannot assign their scores to instruction models.
// The five-shot table also includes instruction models as references; those retain their exact identities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://supergpqa.github.io/';

const board: Leaderboard = {
  benchmark: 'supergpqa',
  url: SITE,
  feed: `${SITE}assets/index-<hash>.js (zero-shot and five-shot results in the bundle)`,
  terms: 'Static GitHub Pages site with no stated terms or robots rules; the SuperGPQA repository publishes the evaluation code and results.',
  aliases: {
    'kimi-k2-0711-preview': 'kimi-k2-jul-2025',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'gpt-4o-2024-05-13': 'gpt-4o-may-2024',
    'gpt-4o-2024-08-06': 'gpt-4o-aug-2024',
    'gpt-4o-2024-11-20': 'gpt-4o-nov-2024',
    'Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
    // the paper's runs (February 2025) used the January R1 and the December V3
    'DeepSeek-R1': 'deepseek-r1',
    'DeepSeek-V3': 'deepseek-v3',
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
    'Llama-3.1-405B-Instruct': 'llama-3-1-405b',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Qwen2.5-0.5B-Instruct': 'qwen2-5-0-5b',
    'Qwen2.5-1.5B-Instruct': 'qwen2-5-1-5b',
    'Qwen2.5-3B-Instruct': 'qwen2-5-3b',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'gemma-2-27b-it': 'gemma-2-27b',
    'gemma-2-9b-it': 'gemma-2-9b',
    'Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
    'Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
    'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
    'Mistral-Small-Instruct-2409': 'mistral-small-v24-09',
    'QwQ-preview': 'qwq-32b-preview',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'Doubao-1.5-pro-32k-250115': 'doubao-1-5-pro',
    'qwen-max-2025-01-25': 'qwen2-5-max',
  },
  async fetch() {
    const page = await fetchText(SITE);
    const src = page.match(/<script[^>]+src="([^"]*\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('bundle not found on the page');
    const js = await fetchText(new URL(src, SITE).href);
    const rows: LeaderboardRow[] = [];
    for (const m of js.matchAll(/"([^"]{2,80})":JSON\.parse\('(\{"(?:zero|five)-shot"[^']*)'\)/g)) {
      const results = JSON.parse(m[2]) as Record<string, Record<string, unknown>>;
      for (const shot of ['zero-shot', 'five-shot']) {
        const result = results[shot];
        if (!result || typeof result.accuracy !== 'number') continue;
        // These are base checkpoints in the five-shot table, not the matching instruction releases.
        const base = shot === 'five-shot' && /^(?:DeepSeek-V3-Base|Llama-3\.1-|MAP-Neo-|Mistral-7B-|Mixtral-|OLMo-2-|Qwen2\.5-|Yi-1\.5-|gemma-2-|granite-3\.1-)/.test(m[1]);
        const effort = m[1].match(/^(o\d-mini)-\d{4}-\d\d-\d\d-(low|medium|high)$/);
        const metrics: Record<string, number> = {};
        for (const difficulty of ['hard', 'middle', 'easy']) {
          const value = result[`accuracy_${difficulty}`];
          if (typeof value === 'number') metrics[difficulty] = value * 100;
        }
        rows.push({ model: base ? `${m[1]} (base)` : effort ? effort[1] : m[1], setting: shot === 'five-shot' ? shot : effort?.[2], score: result.accuracy * 100, metrics });
      }
    }
    if (!rows.length) throw new Error('no results in the bundle');
    return rows;
  },
};
export default board;
