// The Hungarian riddles pilot reports an overall grade across 100 riddles.
// The README maps anonymous labels to model names and gives the grade and four other percentages.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/boczkakaroly/ai-and-data-projects/main/hungarian-riddles-benchmark/readme.md";
const board: Leaderboard = {
  benchmark: 'hungarian-riddles-benchmark',
  url: "https://github.com/boczkakaroly/ai-and-data-projects/blob/main/hungarian-riddles-benchmark/readme.md",
  feed,
  terms: "The raw file host has no robots.txt. The original pilot permits reuse with credit. The Hugging Face riddle dataset lists MIT. https://github.com/boczkakaroly/ai-and-data-projects/tree/main/hungarian-riddles-benchmark and https://huggingface.co/datasets/boczkakaroly/hungarian-riddles-benchmark",
  stats: {
    factual: { name: 'Factuality', unit: '%', better: 'higher' },
    justification: { name: 'Justification quality', unit: '%', better: 'higher' },
    language: { name: 'Language quality', unit: '%', better: 'higher' },
    hallucination: { name: 'Hallucination rate', unit: '%', better: 'lower' },
  },
  aliases: { 'GPT-5 Deep Search': 'gpt-5' },
  async fetch() {
    const source = await fetchText(feed);
    const labels = source.match(/Label\tModel\r?\n([\s\S]*?)\n\s*\n/);
    const summary = source.match(/Model\tOverall\tFactual\tJustification\tLanguage\tHallucination\r?\n([\s\S]*?)(?=⚠|\n\s*\n)/);
    if (!labels || !summary) throw new Error('Missing model key or summary columns');
    const names = new Map(labels[1].trim().split(/\r?\n/).map(l => l.split('\t') as [string,string]));
    const rows = summary[1].trim().split(/\r?\n/).map(line => {
      const [label,...cells] = line.split('\t');
      const model = names.get(label);
      if (!model || cells.length !== 5 || cells.some(s=>!/^\d+(\.\d+)?%$/.test(s))) throw new Error('Incomplete riddle summary');
      const [score,factual,justification,language,hallucination] = cells.map(parseFloat);
      return { model, score, setting: model === 'GPT-5 Deep Search' ? 'Deep Search' : undefined,
        metrics: { factual, justification, language, hallucination } };
    });
    if (rows.length < 6) throw new Error('Missing riddle configurations');
    return rows;
  },
};
export default board;
