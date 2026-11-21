// Miðeind measures Icelandic grammatical error detection accuracy. Its archived leaderboard gives the percentage correct.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Model { name: string; url?: string; thinking?: string; params?: number; scores: Record<string, number | null> }

const feed = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/v1.json";
const board: Leaderboard = {
  benchmark: 'mideind-icelandic-ged',
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/#v1",
  feed,
  terms: "Both hosts allow crawling. Archived column ged uses a 0 to 100 scale. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md",
  aliases: {
    "meta-llama/Meta-Llama-3.1-70B-Instruct": "llama-3-1-70b",
    "meta-llama/Meta-Llama-3-70B-Instruct": "llama-3-70b",
    "meta-llama/Meta-Llama-3.1-8B-Instruct": "llama-3-1-8b",
    "meta-llama/Llama-3.2-3B-Instruct": "llama-3-2-3b",
    "meta-llama/Meta-Llama-3-8B-Instruct": "llama-3-8b",
    "meta-llama/Llama-3.2-1B-Instruct": "llama-3-2-1b",
    "mistral/mistral-medium-2508": "mistral-medium-3-1",
    "mistral/ministral-3b-2410": "ministral-3b",
    "mistralai/Mistral-Nemo-Instruct-2407": "mistral-nemo",
    "google/gemma-2-9b-it": "gemma-2-9b"
},
  async fetch() {
    const data = await fetchJson<{benchmarks: string[][]; models: Model[]}>(feed);
    if (!data.benchmarks.some(([key]) => key === 'ged')) throw new Error('Missing ged column');
    const rows = data.models.flatMap(m => {
      const score = m.scores.ged;
      if (score === null) return [];
      if (!m.name || !Number.isFinite(score)) throw new Error('Invalid ged result');
      return [{ model: m.name, score, setting: m.thinking || undefined, params: m.params ?? undefined, link: m.url || undefined }];
    });
    if (rows.length < 94) throw new Error('Incomplete Icelandic ged archive');
    return rows;
  },
};
export default board;
