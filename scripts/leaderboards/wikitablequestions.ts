// WikiTableQuestions tests whether a model can answer questions about unseen tables.
// Table 5 reports test accuracy, development accuracy, and oracle coverage for each parser or retrieval model.
// Section 6 identifies the authors' system as a floating parser.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://aclanthology.org/P15-1142.pdf';
const board: Leaderboard = {
  benchmark: 'wikitablequestions', url: 'https://ppasupat.github.io/WikiTableQuestions/', feed, static: 'paper',
  terms: 'The ACL Anthology publishes the paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  parts: {
    devAccuracy: { name: 'Development accuracy', unit: '%', better: 'higher' },
    devOracle: { name: 'Development oracle score', unit: '%', better: 'higher' },
    testOracle: { name: 'Test oracle score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/dev\s+test\s+Operation[^\f]+?Table 5: Accuracy \(acc\) and oracle scores \(ora\)/)?.[0];
    if (!table || !/acc\s+ora\s+acc\s+ora/.test(table)) throw new Error('Missing Table 5 test columns');
    const rows = Array.from(table.matchAll(/^\s*(IR baseline|WQ baseline|Our system)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/gm),
      ([, name, dev, devOracle, test, testOracle]) => ({
        model: name === 'Our system' ? 'Floating parser' : name, score: Number(test),
        metrics: { devAccuracy: Number(dev), devOracle: Number(devOracle), testOracle: Number(testOracle) },
      }));
    return checked(rows, 3);
  },
};
export default board;
