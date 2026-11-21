// Miðeind tests Icelandic idiom completion and meaning. Its JSON leaderboard publishes the combined family score and both task scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json";
const board: Leaderboard = {
  benchmark: "mideind-icelandic-idioms",
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/",
  feed: FEED,
  terms: "family:Idioms uses a 0 to 1 scale in the feed. The 102 configurations cover 60 model names. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md The robots file allows this feed for the importer.",
  parts: { completion: 'Completion', meanings: 'Meanings' },
  aliases: { 'Llama 3.1 70B Instruct': 'llama-3-1-70b', 'Llama 3.1 8B Instruct': 'llama-3-1-8b' },
  async fetch() {
    type Model = { display_name: string; thinking: string; tools: string[]; model_url: string; license: string; params_b: number | null;
      family_scores: { Idioms?: number }; scores: Record<string, Record<string, number>>; benchmark_evaluated_at: Record<string, string> };
    const { models } = await fetchJson<{ models: Model[] }>(FEED);
    const cloze = 'icelandic_idioms_cloze@v1';
    const meaning = 'icelandic_idioms_meanings@v1';
    const rows = models.filter(m => m.family_scores.Idioms != null).map(m => {
      const score = m.family_scores.Idioms! * 100;
      const completion = m.scores[cloze]?.accuracy * 100;
      const meanings = m.scores[meaning]?.llm_judge_score * 100;
      if (!m.display_name || ![score, completion, meanings].every(Number.isFinite)) throw new Error('Incomplete Idioms row');
      const date = m.benchmark_evaluated_at[cloze]?.slice(0,10);
      return { model: m.display_name, setting: [m.thinking, ...m.tools].filter(Boolean).join(', '), score,
        metrics: { completion, meanings }, date: date === m.benchmark_evaluated_at[meaning]?.slice(0,10) ? date : undefined,
        link: m.model_url, license: m.license, params: m.params_b ?? undefined };
    });
    if (rows.length < 105) throw new Error('Missing Idioms configurations');
    return rows;
  },
};
export default board;
