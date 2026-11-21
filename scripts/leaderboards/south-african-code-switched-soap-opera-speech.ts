// isiXhosa Speech AI compares transcribers on the Soapies isiXhosa and English test clips.
// The results table identifies character error rate as the headline and reports word error rate alongside it.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/2Ntlaks/isixhosa-speech-ai/main/README.md";
const board: Leaderboard = {
  benchmark: "south-african-code-switched-soap-opera-speech",
  url: "https://github.com/2Ntlaks/isixhosa-speech-ai#results",
  feed,
  terms: "Use the five populated Soapies scores for the 391-clip isiXhosa and English subset. The repository uses the MIT license. The recordings are for research only. The raw file host has no robots.txt.",
  host: 'isiXhosa Speech AI',
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.[3]?.startsWith('Soapies test'));
    if (!table || table[0][0] !== 'Model') throw new Error('Missing Soapies results');
    const rows = table.slice(1).filter(c => !/^[-–—]$/.test(c[3])).map(c => {
      const rates = c[3]?.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      const run = c[0].match(/R-\d+/)?.[0];
      if (!rates || !run) throw new Error('Missing error rates or run identifier');
      return { model: c[0].split(' (')[0], score: Number(rates[1]), metrics: { wer: Number(rates[2]) },
        setting: run, link: 'https://github.com/2Ntlaks/isixhosa-speech-ai/tree/main/runs/' + run };
    });
    if (rows.length < 6) throw new Error('Missing Soapies results');
    return rows;
  },
};
export default board;
