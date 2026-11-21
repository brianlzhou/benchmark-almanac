// Icelandic WinoGrande tests three-shot pronoun resolution. Miðeind's archived v1 leaderboard gives accuracy for each model and thinking setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/v1.json";

const board: Leaderboard = {
  benchmark: "icelandic-winogrande",
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/#v1",
  feed,
  terms: "Archived column winogrande_is uses a 0 to 100 scale. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md Hugging Face allows access in robots.txt.",
  async fetch() {
    type Entry = { name: string; url: string; thinking: string | null; params: number | null; scores: { winogrande_is?: number } };
    const data = await fetchJson<{ benchmarks: [string, string][]; models: Entry[] }>(feed);
    if (!data.benchmarks.some(([k, label]) => k === 'winogrande_is' && label.includes('3-shot'))) throw new Error('Missing WinoGrande-IS column');
    const rows = data.models.filter(m => m.scores.winogrande_is != null).map(m => {
      const score = m.scores.winogrande_is!;
      if (!m.name || !Number.isFinite(score)) throw new Error('Invalid Icelandic WinoGrande row');
      return { model: m.name, setting: ['3-shot', m.thinking && 'thinking ' + m.thinking].filter(Boolean).join(' · '),
        score, params: m.params ?? undefined, link: m.url || undefined };
    });
    if (rows.length < 94) throw new Error('Missing archived WinoGrande-IS entries');
    return rows;
  },
};

export default board;
