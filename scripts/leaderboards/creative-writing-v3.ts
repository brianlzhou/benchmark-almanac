// Creative Writing v3 on eqbench.com. Most eqbench.com boards ship their data as a CSV string inside the page
// script (for example `let leaderboardDataCreativeWritingV3 = \`...\``). eqbenchCsv reads that string as data,
// never runs the script, and returns rows keyed by the CSV header. A leading "*" on a model name marks a model
// new to the board and is dropped. The other eqbench.com importers in this pass use eqbenchCsv.
//
// This board: creative_writing.js has elo_score and creative_writing_score (a 0 to 20 rubric mean). The page
// shows the rubric times 5 as "Rubric Score" beside the Elo, and labs cite that 0 to 100 rubric figure (Qwen3
// 84.6, Ring-1T 85.4), so the rubric times 5 is the score here. Elo is relative to the models on the board.
// Metrics, the CSV columns the table shows unscaled: elo_score (`elo`), repetition_score (`repetition`) and
// avg_length (`length`, characters). Slop and Style are shown rescaled in the page script and are not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

export const EQBENCH_TERMS = 'Generated page script on the eqbench.com GitHub Pages site, which states no terms or license for the scores.';
export const eqbenchFeed = (file: string, variable: string) => `https://eqbench.com/${file} (${variable})`;

/** eqbench.com model names (Hugging Face repo ids, API snapshot names) the shared resolver cannot place. */
export const EQBENCH_ALIASES: Record<string, string> = {
  '01-ai/Yi-1.5-34B-Chat': 'yi-1-5-34b',
  '01-ai/Yi-34B-Chat': 'yi-34b',
  'Qwen/Qwen-1_8B-Chat': 'qwen-1-8b',
  'Qwen/Qwen-7B-Chat': 'qwen-7b',
  'Qwen/Qwen1.5-110B-Chat': 'qwen1-5-110b',
  'Qwen/Qwen1.5-32B-Chat': 'qwen1-5-32b',
  'Qwen/Qwen2.5-14B-Instruct': 'qwen2-5-14b',
  'Qwen/Qwen2.5-32B-Instruct': 'qwen2-5-32b',
  'Qwen/Qwen2.5-3B-Instruct': 'qwen2-5-3b',
  'Qwen/Qwen2.5-7B-Instruct': 'qwen2-5-7b',
  'Qwen/Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
  // OpenRouter's qwen/qwen3-235b-a22b:thinking is the original April 2025 model in thinking mode, not the July 2025
  // thinking model, which the shared resolver would otherwise pick from the word "thinking"
  'qwen/qwen3-235b-a22b:thinking': 'qwen3-235b-a22b',
  'qwen3-235b-a22b:thinking': 'qwen3-235b-a22b',
  // OpenRouter's qwen3-235b-a22b-2507 is the July 2025 Instruct model (the thinking model has its own slug)
  'qwen/qwen3-235b-a22b-2507': 'qwen3-235b-a22b-instruct-jul-2025',
  'qwen3-235b-a22b-2507': 'qwen3-235b-a22b-instruct-jul-2025',
  'qwen/qwen3-30b-a3b-instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
  'databricks/dbrx-instruct': 'dbrx',
  'google/gemma-2-27b-it': 'gemma-2-27b',
  'google/gemma-2-9b-it': 'gemma-2-9b',
  'google/gemma-2b-it': 'gemma-2b',
  'google/gemma-7b-it': 'gemma-7b',
  'google/gemma-3-12b-it': 'gemma-3-12b',
  'google/gemma-3-4b-it': 'gemma-3-4b',
  'google/gemma-4-26B-A4B-it': 'gemma-4-26b-a4b',
  'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
  'openai/gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
  'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023',
  'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024',
  'gpt-4-0314': 'gpt-4-mar-2023',
  'openai/gpt-4-0314': 'gpt-4-mar-2023',
  'chatgpt-4o-latest-2025-01-29': 'gpt-4o-jan-2025',
  'chatgpt-4o-latest-2025-03-27': 'gpt-4o-mar-2025',
  'grok-2-1212': 'grok-2-dec-2024',
  'grok-4.20-beta': 'grok-4-20',
  'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
  'gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024',
  'claude-instant-1.2': 'claude-instant',
  'meta-llama/Llama-2-13b-chat-hf': 'llama-2-13b',
  'meta-llama/Llama-2-70b-chat-hf': 'llama-2-70b',
  'meta-llama/Llama-2-7b-chat-hf': 'llama-2-7b',
  'meta-llama/Meta-Llama-3-70B-Instruct': 'llama-3-70b',
  'meta-llama/Meta-Llama-3-8B-Instruct': 'llama-3-8b',
  'meta-llama/Meta-Llama-3.1-405B-Instruct': 'llama-3-1-405b',
  'meta-llama/Llama-3.1-405B-Instruct': 'llama-3-1-405b',
  'meta-llama/llama-3.1-405b-instruct': 'llama-3-1-405b',
  'meta-llama/llama-3.1-70b-instruct': 'llama-3-1-70b',
  'meta-llama/llama-3.1-8b-instruct': 'llama-3-1-8b',
  'meta-llama/Llama-3.2-1B-Instruct': 'llama-3-2-1b',
  'meta-llama/Llama-3.2-3B-Instruct': 'llama-3-2-3b',
  'meta-llama/llama-3.2-1b-instruct': 'llama-3-2-1b',
  'meta-llama/llama-3.2-3b-instruct': 'llama-3-2-3b',
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct': 'llama-4-maverick',
  'meta-llama/Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1:free': 'llama-3-1-nemotron-ultra-253b-v1',
  'microsoft/Phi-3.5-mini-instruct': 'phi-3-5-mini',
  'mistral-large-2402': 'mistral-large',
  'mistral-large-2407': 'mistral-large-2-jul-2024',
  'mistralai/mistral-large-2411': 'mistral-large-2-nov-2024',
  'mistralai/Mistral-Large-Instruct-2411': 'mistral-large-2-nov-2024',
  'mistralai/Mistral-Large-3-675B-Instruct-2512': 'mistral-large-3',
  'mistralai/Mistral-Small-Instruct-2409': 'mistral-small-v24-09',
  'mistralai/Mistral-Small-24B-Instruct-2501': 'mistral-small-3',
  'mistralai/Mistral-Small-3.1-24B-Instruct-2503': 'mistral-small-3-1',
  'mistralai/mistral-small-3.1-24b-instruct-2503': 'mistral-small-3-1',
  'mistralai/Mistral-Small-3.2-24B-Instruct-2506': 'mistral-small-3-2',
  'mistralai/Mistral-Small-4-119B-2603': 'mistral-small-4',
  'mistralai/Ministral-8B-Instruct-2410': 'ministral-8b',
  'mistralai/Ministral-3-14B-Instruct-2512': 'ministral-3-14b',
  'mistralai/Mistral-Nemo-Instruct-2407': 'mistral-nemo',
  'mistralai/Pixtral-Large-Instruct-2411': 'pixtral-large',
  'mistralai/Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
  'mistralai/Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b',
  'mistralai/Mixtral-8x7B-Instruct-v0.1': 'mixtral-8x7b',
  // plain Kimi-K2-Instruct is the July 2025 release, and the 0905 update is named separately
  'moonshotai/Kimi-K2-Instruct': 'kimi-k2-jul-2025',
  'moonshotai/kimi-k2-0905': 'kimi-k2-sep-2025',
  'meituan-longcat/LongCat-Flash-Chat-FP8': 'longcat-flash-chat',
  'nova-2-lite-v1': 'nova-2-lite',
  'nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16': 'nemotron-3-nano-4b',
  'nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB-BF16': 'nemotron-3-5-bolt-e4b',
  'nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-NVFP4': 'nemotron-3-5-lightning-30b-a3b',
  'tiiuae/falcon-180B-chat': 'falcon-180b',
};

/** The CSV assigned to `variable` in an eqbench.com script, as rows keyed by header, model names cleaned. */
export async function eqbenchCsv(file: string, variable: string): Promise<Record<string, string>[]> {
  const js = await fetchText(`https://eqbench.com/${file}`);
  const at = js.search(new RegExp(`\\b${variable}\\s*=\\s*\``));
  if (at < 0) throw new Error(`${variable} not found in ${file}`);
  const open = js.indexOf('`', at) + 1;
  const close = js.indexOf('`', open);
  const rows = parseCsv(js.slice(open, close).trim());
  if (!rows.length) throw new Error(`no rows in ${variable}`);
  const name = Object.keys(rows[0])[0];
  return rows.map((r) => ({ ...r, [name]: r[name].replace(/^\*/, '').trim() }));
}

/**
 * One row per model: the first CSV column is the model, `column` the score, times `scale`. `metrics` (optional)
 * maps a metric key to a CSV column whose value is kept as is.
 */
export async function eqbenchRows(file: string, variable: string, column: string, scale = 1, metrics?: Record<string, string>): Promise<LeaderboardRow[]> {
  const rows = await eqbenchCsv(file, variable);
  const name = Object.keys(rows[0])[0];
  if (!(column in rows[0])) throw new Error(`no ${column} column in ${variable}`);
  for (const c of Object.values(metrics ?? {})) if (!(c in rows[0])) throw new Error(`no ${c} column in ${variable}`);
  return rows
    .map((r): LeaderboardRow => {
      const row: LeaderboardRow = { model: r[name], score: parseFloat(r[column]) * scale };
      if (metrics) {
        const m = Object.fromEntries(Object.entries(metrics).map(([k, c]) => [k, parseFloat(r[c])]).filter(([, v]) => Number.isFinite(v)));
        if (Object.keys(m).length) row.metrics = m;
      }
      return row;
    })
    .filter((r) => r.model && r.model !== 'random-baseline' && Number.isFinite(r.score));
}

const board: Leaderboard = {
  benchmark: 'creative-writing-v3',
  url: 'https://eqbench.com/creative_writing.html',
  feed: `${eqbenchFeed('creative_writing.js', 'leaderboardDataCreativeWritingV3')} creative_writing_score x 5`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () =>
    eqbenchRows('creative_writing.js', 'leaderboardDataCreativeWritingV3', 'creative_writing_score', 5, {
      elo: 'elo_score',
      repetition: 'repetition_score',
      length: 'avg_length',
    }),
};
export default board;
