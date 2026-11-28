// The authors score Bengali melodies by how often listeners recognize the requested style.
// The generation table in the README gives style and genre accuracy as fractions and four listening ratings.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/Faria-Binte-Kader/South-Asian-Music-data/main/README.md";

const board: Leaderboard = {
  benchmark: "bengali-classical-music-generation-kader",
  url: "https://github.com/Faria-Binte-Kader/South-Asian-Music-data#rq3-can-llms-generate-stylistically-faithful-music",
  feed,
  terms: "The authors give no score reuse license in their repository. The host has no robots.txt.",
  stats: {
    structure: { name: 'Structure rating', unit: 'score', better: 'higher' },
    emotion: { name: 'Emotion rating', unit: 'score', better: 'higher' },
    adherence: { name: 'Adherence rating', unit: 'score', better: 'higher' },
    harmony: { name: 'Harmony rating', unit: 'score', better: 'higher' },
    genreAccuracy: { name: 'Genre accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const header = ["Model", "Structure", "Emotion", "Adherence", "Harmony", "Genre acc.", "Style acc."];
    const table = markdownTables(await fetchText(feed)).find(t => header.every((label, i) => t[0]?.[i] === label));
    if (!table || table.length <= 9) throw new Error('Missing leaderboard columns or rows');
    return table.slice(1).map(cells => {
      const [model, ...values] = cells;
      if (values.length !== 6 || values.some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Missing listening score');
      const [structure, emotion, adherence, harmony, genre, style] = values.map(Number);
      return { model, score: style * 100, setting: 'Level 3 prompts',
        metrics: { structure, emotion, adherence, harmony, genreAccuracy: genre * 100 } };
    });
  },
};
export default board;
