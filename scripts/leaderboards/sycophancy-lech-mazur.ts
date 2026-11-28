// Lech Mazur measures how often a model sides with both opposing narrators. Its README ranks configurations by sycophancy rate and reports decisive coverage and contrarian responses.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/lechmazur/sycophancy/HEAD/README.md";

const board: Leaderboard = {
  benchmark: "sycophancy-lech-mazur",
  url: "https://github.com/lechmazur/sycophancy",
  feed: FEED,
  terms: "The publisher displays results at https://github.com/lechmazur/sycophancy. I could not verify reuse terms. GitHub requests a one-second crawl delay.",
  stats: {
    conditional: { name: 'Conditional sycophancy', unit: '%', better: 'lower', note: 'Sycophancy among cases where the model answers both affective views.' },
    decisiveCoverage: { name: 'Decisive coverage', unit: '%', better: 'higher', note: 'Share of cases where the model takes a side on both opposite views.' },
    stripped: { name: 'Stripped sycophancy', unit: '%', better: 'lower' },
    insufficient: { name: 'Insufficient responses', unit: '%', better: 'lower' },
    contrarian: { name: 'Contrarian rate', unit: '%', better: 'lower', note: 'Responses that reject both opposing narrators.' },
    covered: { name: 'Covered cases', unit: 'count' },
  },
  async fetch() {
    const tables = markdownTables(await fetchText(FEED));
    const main = tables.find(t => t[0].join('|') === 'Rank|Model|Coverage|Sycophancy|Conditional|Decisive Coverage|Stripped|Insufficient');
    const other = tables.find(t => t[0].includes('Contrarian'));
    if (!main || main.length < 25 || !other) throw new Error('Missing sycophancy tables');
    return main.slice(1).map(([,label,coverage,...scores]) => {
      const second = other.slice(1).find(r => r[1] === label);
      const coverageCounts = coverage.split('/').map(Number);
      const pct = (s: string) => { if (!/^\d+(?:\.\d+)?%$/.test(s)) throw new Error('Invalid percentage'); return Number(s.slice(0,-1)); };
      if (!second || coverageCounts.length !== 2) throw new Error('Incomplete sycophancy result');
      const [score,conditional,decisiveCoverage,stripped,insufficient] = scores.map(pct);
      const effort = label.match(/ \(([^()]+)\)$/);
      return { model: effort ? label.slice(0,-effort[0].length) : label, setting: effort?.[1], score,
        metrics: { conditional, decisiveCoverage, stripped, insufficient, contrarian: pct(second[6]), covered: coverageCounts[0] } };
    });
  },
};
export default board;
