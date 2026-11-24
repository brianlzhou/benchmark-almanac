// Fiction.LiveBench tests long-context deep comprehension across 36 questions on 30 Fiction.live stories
// evaluated at eleven context lengths from 0 to 192k tokens. The author publishes results as two PNG tables
// on the official story page (April 04, 2026 current frontier table and September 29, 2025 historical table).
// Rows were transcribed twice from both printed PNG tables on 2026-11-24 and verified against each image's
// SHA-256 digest. Following Epoch AI's convention, the 16k context length is used as the headline score, with
// all eleven context lengths preserved in parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const URL = 'https://fiction.live/stories/Fiction-liveBench-Feb-21-2025/oQdzQvKHw8JyXbN87';
const IMG_APR_2026 = 'https://cdn6.fiction.live/file/fictionlive/a7be0188-9a0a-4b19-a4b3-97e7deecf52e.png';
const SHA_APR_2026 = '67bbb7ab8db59bf573b368e2b4aedb37d8a8c195be4d3e717028877359a9b40c';
const IMG_SEP_2025 = 'https://cdn6.fiction.live/file/fictionlive/5aa21fca-ff97-4483-9dd6-ae141dfe0a9e.png';
const SHA_SEP_2025 = '9fdd97e6a8459ab7941c1adfd5c5a5c858cb7dacfb234bea8cb4b76e44c7bc54';

const CTX_KEYS = ['c0', 'c400', 'c1k', 'c2k', 'c4k', 'c8k', 'c16k', 'c32k', 'c60k', 'c120k', 'c192k'] as const;
const CTX_LABELS: Record<(typeof CTX_KEYS)[number], string> = {
  c0: '0 tokens',
  c400: '400 tokens',
  c1k: '1k tokens',
  c2k: '2k tokens',
  c4k: '4k tokens',
  c8k: '8k tokens',
  c16k: '16k tokens',
  c32k: '32k tokens',
  c60k: '60k tokens',
  c120k: '120k tokens',
  c192k: '192k tokens',
};

const parts: Record<string, BoardPart> = Object.fromEntries(
  CTX_KEYS.map((k) => [k, { name: CTX_LABELS[k], group: 'Context length', unit: '%' }]),
);

type Tuple = [string, string | undefined, ...(number | null)[]];

function toRows(entries: Tuple[]): LeaderboardRow[] {
  return entries.map(([model, setting, ...vals]) => {
    const score = vals[6];
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new Error(`Missing 16k score for ${model}`);
    }
    const metrics: Record<string, number> = {};
    CTX_KEYS.forEach((k, i) => {
      const v = vals[i];
      if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
    });
    return { model, score, ...(setting ? { setting } : {}), metrics };
  });
}

// April 04, 2026 table (19 rows), transcribed twice from IMG_APR_2026
const APR_2026_DATA: Tuple[] = [
  ['gpt-5.2', undefined, 100.0, 100.0, 100.0, 100.0, 100.0, 97.2, 100.0, 97.2, 97.2, 100.0, 96.9],
  ['gpt-5.2-pro', undefined, 100.0, 100.0, 100.0, 91.7, 80.6, 88.9, 83.3, 80.6, 80.6, 75.0, 78.1],
  ['claude-opus-4-6', undefined, 87.5, 94.4, 91.7, 77.8, 97.2, 100.0, 100.0, 94.4, 91.7, 93.8, 0.0],
  ['claude-opus-4-5', undefined, 87.5, 100.0, 100.0, 94.4, 97.2, 91.7, 94.4, 94.4, 97.2, 93.8, 0.0],
  ['claude-sonnet-4-5', undefined, 100.0, 94.4, 97.2, 91.7, 91.7, 91.7, 86.1, 91.7, 88.9, 75.0, 0.0],
  ['deepseek-v3.2', 'reasoning: high, deepseek', 100.0, 97.2, 100.0, 91.7, 88.9, 80.6, 86.1, 66.7, 63.9, null, null],
  ['deepseek-v3.2-exp', 'reasoning: high, deepseek', 100.0, 100.0, 97.2, 97.2, 91.7, 94.4, 83.3, 83.3, 71.4, null, null],
  ['gemini-3-flash-preview', undefined, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 96.9, 100.0, 100.0],
  ['gemini-3-pro-preview', undefined, 100.0, 94.4, 100.0, 100.0, 100.0, 97.2, 96.6, 94.4, 100.0, 96.9, 96.9],
  ['glm-5', 'reasoning: high, z-ai', 100.0, 97.2, 100.0, 97.1, 100.0, 91.7, 91.7, 88.2, 87.5, 85.7, null],
  ['glm-4.7', 'reasoning: high, z-ai', 100.0, 94.4, 91.7, 83.3, 86.1, 80.6, 83.3, 88.9, 80.6, 15.6, null],
  ['grok-4', undefined, 100.0, 97.2, 100.0, 88.9, 94.4, 100.0, 94.4, 91.7, 97.2, 96.9, 84.4],
  ['kimi-k2.5', 'reasoning: high, moonshotai', 100.0, 100.0, 100.0, 100.0, 94.4, 88.9, 86.1, 88.9, 88.9, 78.1, 87.5],
  ['minimax-m2.5', 'reasoning: high, minimax/fp8', 100.0, 91.7, 83.3, 75.0, 69.4, 55.6, 63.9, 47.2, 50.0, 40.6, null],
  ['minimax-m2.1', 'reasoning: high, minimax', 87.5, 83.3, 75.0, 77.8, 69.4, 58.3, 52.8, 61.1, 44.4, 21.9, null],
  ['nemotron-3-nano-30b-a3b', undefined, 100.0, 69.4, 61.1, 58.3, 55.6, 52.8, 50.0, 52.8, 47.2, 50.0, 37.5],
  ['qwen3.6-plus', 'reasoning: high, alibaba', 87.5, 97.2, 82.9, 61.1, 69.4, 61.1, 66.7, 61.1, 66.7, 75.0, 71.9],
  ['qwen3.5-plus-02-15', 'reasoning: high, alibaba', 100.0, 100.0, 94.4, 83.3, 86.1, 91.7, 77.8, 80.6, 91.2, 76.2, 76.0],
  ['qwen3-235b-a22b-thinking-2507', 'chutes', 100.0, 100.0, 91.7, 86.1, 91.7, 97.2, 75.0, 80.6, 77.8, 68.8, null],
];

// September 29, 2025 historical table (42 non-overlapping rows, omitting 3 identical rows already in APR_2026_DATA)
const SEP_2025_DATA: Tuple[] = [
  ['gpt-oss-120b', 'high, chutes', 100.0, 75.0, 61.1, 55.6, 52.8, 47.2, 44.4, 44.4, 38.9, null, null],
  ['gpt-5', undefined, 100.0, 97.2, 94.4, 97.2, 97.2, 100.0, 97.2, 97.2, 100.0, 96.9, 87.5],
  ['gpt-5-mini', undefined, 100.0, 97.2, 88.9, 80.6, 77.8, 66.7, 69.4, 63.9, 61.1, 62.5, 59.4],
  ['gpt-5-nano', undefined, 75.0, 58.3, 63.9, 50.0, 50.0, 52.8, 44.4, 47.2, 36.1, 21.9, 34.4],
  ['o3', undefined, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 88.9, 100.0, 83.3, 100.0, 58.1],
  ['o4-mini', undefined, 100.0, 100.0, 100.0, 100.0, 77.8, 66.7, 77.8, 55.6, 66.7, 62.5, 43.8],
  ['claude-opus-4', 'thinking', 100.0, 94.4, 97.2, 94.4, 94.4, 83.3, 69.4, 80.6, 69.4, 62.5, null],
  ['claude-sonnet-4', 'thinking', 100.0, 100.0, 100.0, 97.2, 100.0, 97.2, 100.0, 91.7, 94.4, 81.3, null],
  ['deepseek-r1-0528', undefined, 100.0, 91.7, 83.3, 82.9, 88.9, 86.1, 75.0, 69.4, 58.3, null, null],
  ['deepseek-chat-v3.1', 'reasoning: high, deepseek', 100.0, 100.0, 94.4, 86.1, 91.7, 80.6, 72.2, 63.9, 58.3, 62.5, null],
  ['gemini-2.5-flash-lite-preview-06-17', 'thinking', 100.0, 66.7, 52.8, 52.8, 55.6, 47.2, 47.2, 44.4, 27.8, 21.9, 37.5],
  ['gemini-2.5-flash (snapshot unspecified)', undefined, 100.0, 94.4, 88.9, 86.1, 77.8, 69.4, 80.6, 69.4, 63.9, 65.6, 78.1],
  ['gemini-2.5-pro-preview-06-05', undefined, 100.0, 100.0, 100.0, 97.2, 94.4, 80.6, 91.7, 91.7, 83.3, 87.5, 90.6],
  ['minimax-m1', undefined, 87.5, 86.1, 94.4, 91.7, 88.9, 69.4, 69.4, 72.2, 58.3, 59.4, 71.9],
  ['qwen3-30b-a3b-thinking-2507', 'chutes', 100.0, 86.1, 75.0, 58.3, 58.3, 52.8, 47.2, 52.8, 47.2, 53.1, null],
  ['qwen3-next-80b-a3b-thinking', 'deepinfra/bf16', 100.0, 75.0, 72.2, 63.9, 61.1, 58.3, 55.6, 52.8, 55.6, 62.5, 46.9],
  ['qwq-32b', undefined, 100.0, 91.7, 94.4, 88.9, 94.4, 86.1, 83.3, 80.6, 61.1, null, null],
  ['qwen3-235b-a22b', undefined, 100.0, 90.0, 89.3, 80.0, 69.0, 66.7, 67.7, null, null, null, null],
  ['qwen3-32b', undefined, 80.0, 90.9, 93.8, 76.7, 86.7, 80.0, 74.2, null, null, null, null],
  ['qwen3-14b', undefined, 83.3, 64.5, 61.8, 59.4, 64.7, 51.6, 62.5, null, null, null, null],
  ['qwen3-8b', undefined, 100.0, 77.4, 63.3, 66.7, 74.2, 61.3, 62.1, null, null, null, null],
  ['grok-4-fast', undefined, 100.0, 100.0, 94.4, 100.0, 97.2, 94.4, 94.4, 91.7, 80.6, 75.0, 78.1],
  ['sonoma-sky-alpha', undefined, 100.0, 97.2, 97.2, 97.2, 94.4, 100.0, 94.4, 86.1, 83.3, 84.4, 84.4],
  ['glm-4.5', 'chutes/fp8', 100.0, 97.2, 86.1, 75.0, 83.3, 63.9, 58.3, 66.7, 47.2, null, null],
  ['nemotron-nano-9b-v2', undefined, 87.5, 58.3, 55.6, 38.9, 38.9, 16.7, 25.0, 19.4, 22.2, null, null],
  ['gpt-oss-120b', 'non-reasoning, chutes', 100.0, 69.4, 58.3, 52.8, 47.2, 27.8, 36.1, 33.3, 33.3, null, null],
  ['gpt-4.1', 'non-reasoning', 100.0, 91.7, 75.0, 69.4, 63.9, 55.6, 63.9, 58.3, 52.8, 62.5, 56.3],
  ['chatgpt-4o-latest (snapshot unspecified)', 'non-reasoning', 87.5, 83.3, 66.7, 63.9, 63.9, 66.7, 66.7, 63.9, 55.6, 65.6, null],
  ['gpt-4.5-preview', 'non-reasoning', 100.0, 94.4, 83.3, 83.3, 83.3, 72.2, 63.9, 63.9, 66.7, 63.9, null],
  ['gpt-5-chat-latest', 'non-reasoning', 87.5, 91.7, 80.6, 69.4, 66.7, 58.3, 55.6, 55.6, 55.6, 43.8, null],
  ['claude-opus-4', 'non-reasoning', 100.0, 77.8, 77.8, 66.7, 66.7, 66.7, 61.1, 63.9, 55.6, 37.5, null],
  ['claude-sonnet-4', 'non-reasoning', 100.0, 77.8, 62.5, 66.7, 55.6, 55.6, 46.9, 44.4, 37.5, 36.4, null],
  ['deepseek-chat-v3.1', 'non-reasoning, deepseek', 87.5, 66.7, 63.9, 50.0, 61.1, 55.6, 52.8, 50.0, 50.0, 53.1, null],
  ['deepseek-v3.2-exp', 'non-reasoning', 50.0, 52.8, 52.8, 52.8, 50.0, 52.8, 52.8, 50.0, 47.2, null, null],
  ['gemini-2.5-flash-lite-preview-06-17', 'non-reasoning', 50.0, 38.9, 27.8, 33.3, 36.1, 30.6, 22.2, 27.8, 36.1, 31.3, 43.8],
  ['gemini-2.5-flash-preview (snapshot unspecified)', 'non-reasoning', 62.5, 63.9, 69.4, 61.1, 47.2, 44.4, 47.2, 44.4, 58.3, 53.1, null],
  ['llama-4-maverick', 'non-reasoning', 100.0, 56.0, 50.0, 52.0, 48.0, 48.0, 46.2, 44.0, 32.0, 36.4, null],
  ['llama-4-scout', 'non-reasoning', 62.5, 52.0, 50.0, 36.0, 32.0, 40.0, 36.0, 16.0, 24.0, 27.3, null],
  ['kimi-k2-0905', 'non-reasoning, fireworks/fp8', 87.5, 75.0, 72.2, 72.2, 66.7, 58.3, 66.7, 63.9, 55.6, 40.6, 50.0],
  ['qwen3-235b-a22b-07-25', 'non-reasoning, parasail/bf16', 87.5, 60.0, 43.8, 47.1, 52.9, 50.0, 52.9, 52.9, 50.0, 44.4, 28.6],
  ['qwen-max Sep 23, 2025', 'non-reasoning', 75.0, 69.4, 69.4, 63.9, 72.2, 63.9, 66.7, null, null, null, null],
  ['qwen3-next-80b-a3b-instruct', 'non-reasoning, chutes', 75.0, 52.8, 50.0, 50.0, 38.9, 47.2, 41.7, 41.7, 38.9, 46.9, 31.3],
];

const board: Leaderboard = {
  benchmark: 'fiction-livebench',
  url: URL,
  feed: `${IMG_APR_2026} and ${IMG_SEP_2025} (transcribed 2026-11-24)`,
  terms: 'Public Fiction.liveBench results page. https://fiction.live/stories/Fiction-liveBench-Feb-21-2025/oQdzQvKHw8JyXbN87',
  headline: 'Accuracy at 16k context length (matching Epoch AI), with all eleven context lengths from 0 to 192k tokens kept in parts.',
  aliases: {
    'gemini-3-flash-preview': 'gemini-3-flash',
    'gemini-3-pro-preview': 'gemini-3-pro',
    'qwen3.5-plus-02-15': 'qwen3-5-plus',
    'deepseek-chat-v3.1': 'deepseek-v3-1',
    'deepseek-r1-0528': 'deepseek-r1-may-2025',
    'gemini-2.5-flash-lite-preview-06-17': 'gemini-2-5-flash-lite-jun-2025',
    'gemini-2.5-pro-preview-06-05': 'gemini-2-5-pro-jun-2025',
    'gpt-5-chat-latest': 'gpt-5-chat',
    'kimi-k2-0905': 'kimi-k2-sep-2025',
    'qwen3-235b-a22b-07-25': 'qwen3-235b-a22b-instruct-jul-2025',
    'qwen3-235b-a22b-thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    'qwen3-30b-a3b-thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
    'qwen-max Sep 23, 2025': 'qwen3-max',
    'nemotron-nano-9b-v2': 'nvidia-nemotron-nano-9b-v2',
  },
  parts,
  async fetch() {
    const [aprRows, sepRows] = await Promise.all([
      checkedImageRows(IMG_APR_2026, SHA_APR_2026, toRows(APR_2026_DATA)),
      checkedImageRows(IMG_SEP_2025, SHA_SEP_2025, toRows(SEP_2025_DATA)),
    ]);
    return [...aprRows, ...sepRows];
  },
};

export default board;
