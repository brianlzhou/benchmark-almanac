// CMMU evaluates Chinese school questions across seven subjects. Its README gives whole-test averages for two grading settings, which differ in how they grade fill-in-the-blank answers.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/flageval-baai/CMMU/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "cmmu",
  url: "https://github.com/flageval-baai/CMMU",
  feed: FEED,
  terms: "The publisher displays results at https://github.com/flageval-baai/CMMU. I could not verify reuse terms. GitHub requests a one-second crawl delay.",
  stats: { validation: { name: 'Validation average', unit: '%', better: 'higher' } },
  async fetch() {
    const source = await fetchText(FEED);
    return ['GPT-4', 'rules'].flatMap((judge) => {
      const section = source.split(`**Evaluate fill-in-the-blank questions by ${judge}**`)[1];
      const table = section && markdownTables(section)[0];
      if (!table || table[0].join('|') !== 'Model|Val Avg.|Test Avg.' || table.length < 11) throw new Error(`Missing ${judge} results`);
      return table.slice(1).map(([model, val, test]) => {
        if (!model || !test || !val || ![Number(test), Number(val)].every(Number.isFinite)) throw new Error('Incomplete CMMU row');
        return { model, setting: `Fill-in-the-blank grading by ${judge}`, score: Number(test), metrics: { validation: Number(val) } };
      });
    });
  },
};
export default board;
