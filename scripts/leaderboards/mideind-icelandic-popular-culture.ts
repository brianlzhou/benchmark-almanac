// Miðeind publishes the recall family score for Icelandic popular culture. The Space also gives song and quotation scores by category.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Model { family_scores: Record<string, number>; display_name: string; model_url?: string; params_b?: number; license?: string; thinking?: string; tools: string[]; benchmark_evaluated_at: Record<string, string>; scores: Record<string, Record<string, number>> }


const feed = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json";
const board: Leaderboard = {
  benchmark: 'mideind-icelandic-popular-culture',
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/",
  feed,
  terms: "Both hosts allow crawling. family:recall uses a 0 to 1 scale in the feed. The 102 configurations cover 60 model names. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md",
  parts: {},
  aliases: { 'Llama 3.1 70B Instruct': 'llama-3-1-70b', 'Llama 3.1 8B Instruct': 'llama-3-1-8b' },
  async fetch() {
    const data = await fetchJson<{models: Model[]}>(feed);
    const rows = data.models.flatMap(m => {
      const score = m.family_scores.recall;
      if (score == null) return [];
      if (!m.display_name || !Number.isFinite(score)) throw new Error('Invalid recall score');
      const metrics: Record<string, number> = {};
      const dates = new Set<string>();
      for (const [key, group] of [['icelandic_song_lyrics@v1', 'Song Lyrics'], ['icelandic_phrases@v1', 'Famous Phrases']]) {
        const part = m.scores[key];
        if (!part || !Number.isFinite(part.accuracy)) throw new Error('Missing ' + group);
        for (const [name, value] of Object.entries(part)) {
          const label = name === 'accuracy' ? group : group + ': ' + name.replace(/^accuracy_/, '');
          if (!Number.isFinite(value)) throw new Error('Invalid ' + label);
          board.parts![label] = label;
          metrics[label] = value * 100;
        }
        if (m.benchmark_evaluated_at[key]) dates.add(m.benchmark_evaluated_at[key].slice(0,10));
      }
      return [{ model: m.display_name, score: score * 100, setting: [m.thinking, ...m.tools].filter(Boolean).join(', ') || undefined,
        license: m.license || undefined, params: m.params_b ?? undefined, link: m.model_url || undefined, date: dates.size === 1 ? [...dates][0] : undefined, metrics }];
    });
    if (rows.length < 105) throw new Error('Incomplete popular culture standings');
    return rows;
  },
};
export default board;
