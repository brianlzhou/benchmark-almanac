// Miðeind scores multiple-choice science questions in Icelandic. Its archived leaderboard reports ARC-Challenge-IS accuracy directly in percent.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/v1.json";
const board: Leaderboard = {
  benchmark: "mideind-icelandic-arc-challenge",
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/#v1",
  feed: FEED,
  terms: "Archived column arc_challenge_is uses a 0 to 100 scale. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md The robots file allows this feed for the importer.",
  aliases: {
  "meta-llama/Meta-Llama-3.1-70B-Instruct": "llama-3-1-70b",
  "meta-llama/Meta-Llama-3-70B-Instruct": "llama-3-70b",
  "meta-llama/Meta-Llama-3.1-8B-Instruct": "llama-3-1-8b",
  "meta-llama/Llama-3.2-3B-Instruct": "llama-3-2-3b",
  "meta-llama/Meta-Llama-3-8B-Instruct": "llama-3-8b",
  "meta-llama/Llama-3.2-1B-Instruct": "llama-3-2-1b",
  "mistral/mistral-medium-2508": "mistral-medium-3-1",
  "mistral/ministral-3b-2410": "ministral-3b",
  "mistralai/Mistral-Nemo-Instruct-2407": "mistral-nemo"
},
  async fetch() {
    type Entry = { name: string; type: string; thinking?: string; params?: number; url: string; scores: { arc_challenge_is?: number } };
    const data = await fetchJson<{ benchmarks: string[][]; models: Entry[] }>(FEED);
    if (!data.benchmarks.some(([key]) => key === 'arc_challenge_is')) throw new Error('Missing ARC-Challenge-IS column');
    const rows = data.models.filter(m => m.scores.arc_challenge_is != null).map(m => {
      const score = m.scores.arc_challenge_is!;
      if (!m.name || !Number.isFinite(score)) throw new Error('Invalid ARC-Challenge-IS row');
      return { model: m.name, score, setting: [m.type, m.thinking].filter(Boolean).join(', '), params: m.params ?? undefined, link: m.url || undefined };
    });
    if (rows.length < 92) throw new Error('Missing archived ARC-Challenge-IS entries');
    return rows;
  },
};
export default board;
