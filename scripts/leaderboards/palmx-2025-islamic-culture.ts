// PalmX ranks Islamic Culture submissions by test accuracy. The official results page has a separate table for this subtask.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://palmx.dlnlp.ai/leaderboard.html";
const board: Leaderboard = {
  benchmark: 'palmx-2025-islamic-culture',
  url: "https://palmx.dlnlp.ai/leaderboard.html",
  feed,
  terms: "The host has no robots file. The Islamic Culture table ranks 6 teams. The site states all rights reserved. https://palmx.dlnlp.ai/leaderboard.html",
  async fetch() {
    const section = (await fetchText(feed)).split('Islamic Culture Subtask Results')[1];
    const table = section && tables(section)[0];
    if (!table || table.length < 7 || table[0].map(c => c.text).join('|') !== 'Rank|Team|Affiliation|Accuracy|Members') throw new Error('Missing Islamic Culture results');
    return table.slice(1).map(c => {
      const model = c[1].text, score = num(c[3].text);
      if (!model || score == null) throw new Error('Missing PalmX team or accuracy');
      return { model, score, submitter: c[2].text };
    });
  },
};
export default board;
