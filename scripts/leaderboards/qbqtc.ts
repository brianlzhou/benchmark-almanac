// QBQTC tests relevance judgments for Chinese query-title pairs. The repository reports F1 and accuracy on its public test set, alongside training and validation scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/CLUEbenchmark/QBQTC/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "qbqtc",
  url: "https://github.com/CLUEbenchmark/QBQTC",
  feed: FEED,
  terms: "The publisher displays results at https://github.com/CLUEbenchmark/QBQTC. I could not verify reuse terms. GitHub requests a one-second crawl delay.",
  stats: {
    accuracy: { name: "Accuracy", unit: "%", better: "higher" },
    devF1: { name: "Development F1", unit: "%", better: "higher" },
    devAccuracy: { name: "Development accuracy", unit: "%", better: "higher" },
    trainF1: { name: "Training F1", unit: "%", better: "higher" },
    trainAccuracy: { name: "Training accuracy", unit: "%", better: "higher" },
  },
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0][0] === '模型' && t[0][3]?.includes('test_public'));
    if (!table || table.length < 4) throw new Error('Missing QBQTC baseline comparison');
    return table.slice(1).map(([model,train,dev,test,setting]) => {
      const scores = [train,dev,test].map(v => v.match(/F1:\s*([\d.]+)\s+Acc:\s*([\d.]+)/i));
      if (!model || scores.some(s => !s)) throw new Error('Incomplete QBQTC results');
      const [a,b,c] = scores;
      return { model, score: Number(c![1]), setting, metrics: { accuracy:Number(c![2]), devF1:Number(b![1]), devAccuracy:Number(b![2]), trainF1:Number(a![1]), trainAccuracy:Number(a![2]) } };
    });
  },
};
export default board;
