// Indic-KCC ranks agricultural advisory models by correctness on a five-point rubric.
// Its README gives the other three rubric scores, parse rate and English versus Indic accuracy.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/sthanika-ai/Indic-Agri-Benchmark-Model-Configs/main/README.md";
const board: Leaderboard = {
  benchmark: "indic-kcc-agri-advisory",
  url: "https://github.com/sthanika-ai/Indic-Agri-Benchmark-Model-Configs",
  feed,
  terms: "The repository applies MIT to code. Authors flag the Mistral Small 3.1 24B result. See the Results and License sections. The raw file host has no robots.txt.",
  parts: { english: 'English', indic: 'Indic average' },
  stats: {
    naturalness: { name: 'Naturalness', unit: 'score', better: 'higher' },
    groundedness: { name: 'Groundedness', unit: 'score', better: 'higher' },
    safety: { name: 'Safety', unit: 'score', better: 'higher' },
    parseRate: { name: 'Parse rate', unit: 'score', better: 'higher', note: 'Fraction of outputs that the evaluator parsed successfully, from 0 to 1.' },
  },
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const overall = tables.find(t => t[0]?.join('|') === '#|model|params|correctness|naturalness|groundedness|safety|parse OK');
    const languages = tables.find(t => t[0]?.join('|') === 'model|English|Indic avg|gap');
    if (!overall || overall.length < 22 || !languages) throw new Error('Missing Indic-KCC tables');
    return overall.slice(1).map(([, model, size, ...fields]) => {
      const lang = languages.slice(1).find(r => r[0] === model.split(' (')[0]);
      if (!model || !lang || [...fields, ...lang.slice(1, 3)].some(s => !s || !Number.isFinite(Number(s)))) throw new Error('Missing Indic-KCC scores');
      const [score, naturalness, groundedness, safety, parseRate] = fields.map(Number);
      const params = size.match(/^(\d+(?:\.\d+)?)B/);
      return { model, score, params: params ? Number(params[1]) : undefined, metrics: { naturalness, groundedness, safety, parseRate,
        english: Number(lang[1]), indic: Number(lang[2]) } };
    });
  },
};
export default board;
