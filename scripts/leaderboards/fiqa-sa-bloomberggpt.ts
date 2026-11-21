// FinGPT reports weighted F1 for FiQA financial sentiment. Read only the FiQA-SA row in its model comparison.
// The authors distinguish their independent split from the BloombergGPT result.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/AI4Finance-Foundation/FinGPT/master/fingpt/FinGPT_Sentiment_Analysis_v3/README.md";
const board: Leaderboard = {
  benchmark: "fiqa-sa-bloomberggpt",
  url: "https://github.com/AI4Finance-Foundation/FinGPT/blob/master/fingpt/FinGPT_Sentiment_Analysis_v3/README.md",
  feed: FEED,
  terms: "FinGPT licenses its repository under MIT. https://github.com/AI4Finance-Foundation/FinGPT/blob/master/LICENSE The raw file host has no robots.txt.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0][0] === 'Weighted F1');
    const scores = table?.find(row => row[0] === 'FiQA-SA [2]');
    if (!scores || !table || scores.length !== table[0].length || scores.length < 15) throw new Error('Missing FiQA-SA results');
    return table[0].slice(1).map((name, i) => {
      const value = scores[i + 1];
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid FiQA score for ' + name);
      return { model: /^v/.test(name) ? 'FinGPT ' + name : name, score: Number(value) };
    });
  },
};
export default board;
