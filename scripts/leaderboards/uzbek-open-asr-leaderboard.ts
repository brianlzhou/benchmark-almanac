// NavAI ranks open Uzbek ASR systems by macro word error rate across four domains.
// The all-architectures Markdown table also reports pooled word error rate and training overlap.
import type { Leaderboard } from './types.ts';
import { uzbekScores } from './feruzaspeech.ts';

const FEED = "https://raw.githubusercontent.com/NavAI-pro/uzbek-text-norm/main/LEADERBOARD_ALL.md";

const board: Leaderboard = {
  benchmark: "uzbek-open-asr-leaderboard",
  url: "https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LEADERBOARD_ALL.md",
  feed: FEED,
  terms: "Read the macro column. The repository includes an MIT license. Retain the model-specific training overlap and decoding notes. https://github.com/NavAI-pro/uzbek-text-norm/blob/main/LICENSE GitHub requests a one-second crawl delay.",
  parts: {
    feruza: { name: 'feruza', unit: '%', better: 'lower' },
    FLEURS: { name: 'FLEURS', unit: '%', better: 'lower' },
    USC: { name: 'USC', unit: '%', better: 'lower' },
    CV: { name: 'CV', unit: '%', better: 'lower' },
  },
  stats: { micro: { name: 'Micro word error rate', unit: '%', better: 'lower' } },
  async fetch() {
    return (await uzbekScores()).map(({ scores, ...entry }) => {
      const { macro, ...metrics } = scores;
      return { ...entry, score: macro, metrics };
    });
  },
};
export default board;
