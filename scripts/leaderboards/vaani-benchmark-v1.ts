// Vaani Benchmark V1.0 (ARTPARK at IISc) Indian-language speech recognition benchmark.
// Reads the live Hugging Face dataset leaderboard API for ARTPARK-IISc/Vaani-Benchmark-V1.0,
// which reports default Hindi test word error rates (%, lower is better) along with Hugging Face
// verification status, submitter organization, parameter counts and model repository links.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://huggingface.co/datasets/ARTPARK-IISc/Vaani-Benchmark-V1.0';
const FEED = 'https://huggingface.co/api/datasets/ARTPARK-IISc/Vaani-Benchmark-V1.0/leaderboard';

interface VaaniEntry {
  rank: number;
  value: number;
  verified?: boolean;
  modelId: string;
  num_parameters?: number;
  author?: { fullname?: string; name?: string };
}

const board: Leaderboard = {
  benchmark: 'vaani-benchmark-v1',
  url: URL,
  feed: FEED,
  terms: 'Public Hugging Face dataset leaderboard for ARTPARK-IISc/Vaani-Benchmark-V1.0 (CC BY 4.0).',
  verified: 'verified by Hugging Face',
  aliases: {
    'Qwen/Qwen3-ASR-0.6B-hf': 'qwen3-asr-0-6b',
    'google/gemma-4-12B': 'gemma-4-12b-it',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const entries = await fetchJson<VaaniEntry[]>(FEED);
    if (!Array.isArray(entries) || entries.length < 10) {
      throw new Error('Expected at least ten Vaani Benchmark V1.0 leaderboard entries');
    }
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      if (!e.modelId || typeof e.value !== 'number' || !Number.isFinite(e.value)) continue;
      const params =
        typeof e.num_parameters === 'number' && Number.isFinite(e.num_parameters) && e.num_parameters > 0
          ? Number((e.num_parameters / 1e9).toPrecision(4))
          : undefined;
      rows.push({
        model: e.modelId,
        score: e.value,
        verified: Boolean(e.verified),
        submitter: e.author?.fullname || e.author?.name,
        params,
        link: `https://huggingface.co/${e.modelId}`,
      });
    }
    return checked(rows, 10);
  },
};

export default board;
