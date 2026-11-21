// Miðeind scores Icelandic grammatical error correction by exact match. The Space publishes accuracy for all sentences and for sentences with and without errors.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Model { display_name: string; model_url?: string; params_b?: number; license?: string; thinking?: string; tools: string[]; benchmark_evaluated_at: Record<string, string>; scores: Record<string, Record<string, number>> }

const feed = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json";
const board: Leaderboard = {
  benchmark: 'mideind-icelandic-gec',
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/",
  feed,
  terms: "Both hosts allow crawling. icelandic_gec@v1 uses a 0 to 1 scale in the feed. The 102 configurations cover 60 model names. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md",
  parts: { withError: 'With error', errorFree: 'Error free' },
  aliases: { 'Llama 3.1 70B Instruct': 'llama-3-1-70b', 'Llama 3.1 8B Instruct': 'llama-3-1-8b' },
  async fetch() {
    const key = 'icelandic_gec@v1';
    const data = await fetchJson<{models: Model[]}>(feed);
    const rows = data.models.flatMap(m => {
      const result = m.scores[key];
      if (!result) return [];
      const {accuracy, accuracy_with_error, accuracy_error_free} = result;
      if (!m.display_name || ![accuracy, accuracy_with_error, accuracy_error_free].every(Number.isFinite)) throw new Error('Invalid GEC score');
      return [{ model: m.display_name, score: accuracy * 100, setting: [m.thinking, ...m.tools].filter(Boolean).join(', ') || undefined,
        license: m.license || undefined, params: m.params_b ?? undefined, link: m.model_url || undefined, date: m.benchmark_evaluated_at[key]?.slice(0,10),
        metrics: { withError: accuracy_with_error * 100, errorFree: accuracy_error_free * 100 } }];
    });
    if (rows.length < 105) throw new Error('Missing GEC configurations');
    return rows;
  },
};
export default board;
