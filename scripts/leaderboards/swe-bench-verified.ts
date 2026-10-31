// SWE-bench Verified: swebench.com is built from data/leaderboards.json in the SWE-bench/swe-bench.github.io
// repository (the page embeds the same array). The "Verified" board holds every submission, scored as
// % resolved. The site's default view is the "Bash Only" preset, which is the Agent filter set to
// mini-SWE-agent; those rows carry harness "mini-SWE-agent" here, and the other scaffolds keep their names.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json';

interface Result {
  name: string;
  agent: string;
  model_display: string;
  reasoning_effort: string | null;
  resolved: number;
  date: string;
  tags: string[];
}

const board: Leaderboard = {
  benchmark: 'swe-bench-verified',
  url: 'https://www.swebench.com/',
  feed: FEED,
  terms: 'Repository file in SWE-bench/swe-bench.github.io, licensed CC BY-NC 4.0 (attribution, non-commercial use).',
  aliases: {
    'Claude 4 Opus': 'claude-opus-4',
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'Claude 4.5 Haiku': 'claude-haiku-4-5',
    'Claude 4.5 Opus': 'claude-opus-4-5',
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'Claude 4.6 Opus': 'claude-opus-4-6',
    // the model is Claude 3.7 Sonnet (tag "Model: claude-3-7-sonnet-20250219"); "Review Heavy" is the system
    'Claude 3.7 Sonnet w/ Review Heavy': 'claude-3-7-sonnet',
    'DeepSeek V3.2 Reasoner': 'deepseek-v3-2',
    'Gemini 2.0 Flash (v20241212-experimental)': 'gemini-2-0-flash-dec-2024',
    'GPT-4 (1106)': 'gpt-4-turbo-nov-2023',
    // both rows are from August 2025, before the 0905 release
    'Kimi K2 Instruct': 'kimi-k2-jul-2025',
    'Llama 4 Maverick Instruct': 'llama-4-maverick',
    'Llama 4 Scout Instruct': 'llama-4-scout',
    'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
    'Qwen3-Coder 480B/A35B Instruct': 'qwen3-coder-480b-a35b',
    'Devstral Small (2512)': 'devstral-small-2',
  },
  async fetch() {
    const data = await fetchJson<{ leaderboards: { name: string; results: Result[] }[] }>(FEED);
    const verified = data.leaderboards.find((b) => b.name === 'Verified');
    if (!verified) throw new Error('no Verified board in leaderboards.json');
    return verified.results
      .filter((r) => r.model_display && !/^multiple$/i.test(r.model_display)) // "Multiple": several models
      .map((r) => ({
        model: r.model_display,
        score: Number(r.resolved),
        setting: r.reasoning_effort?.toLowerCase() || undefined,
        harness: r.agent,
        date: r.date,
      }));
  },
};
export default board;
