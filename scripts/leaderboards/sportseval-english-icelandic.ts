// SportsEval scores the percentage of correctly translated sports terms. The revised all-systems TSV includes domain scores and consistency counts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/stofnun-arna-magnussonar/SportsEval/main/evaluation/automatic/autoeval_allsystems.tsv";
const board: Leaderboard = {
  benchmark: 'sportseval-english-icelandic',
  url: "https://github.com/stofnun-arna-magnussonar/SportsEval/blob/main/evaluation/automatic/autoeval_allsystems.tsv",
  feed,
  terms: "GitHub requests a one-second delay and the raw host has no robots file. Revised string matching across 717 term occurrences. Keep WMT25 paper scores separate. Data CC BY 4.0. https://github.com/stofnun-arna-magnussonar/SportsEval#license",
  async fetch() {
    const [header, ...lines] = (await fetchText(feed)).trim().split(/\r?\n/);
    const fields = header.split('\t'), headline = 'Correct Terms (string match)';
    const domains = ['Chess', 'Basketball', 'Golf', 'Gymnastics', 'Football'];
    if (fields[0] !== 'file_name' || ![headline, ...domains.map(d => d + ' terms')].every(h => fields.includes(h)) || lines.length < 34) throw new Error('Missing SportsEval standings');
    board.parts = Object.fromEntries(domains.map(d => [d + ' terms', d + ' terms']));
    return lines.map(line => {
      const [file, ...values] = line.split('\t');
      if (!file.endsWith('.txt') || values.length !== fields.length - 1) throw new Error('Incomplete SportsEval row');
      const metrics: Record<string, number> = {};
      for (const [i, value] of values.entries()) {
        const number = Number(value.replace(/%$/, ''));
        if (!value || !Number.isFinite(number)) throw new Error('Invalid SportsEval value for ' + file);
        metrics[fields[i + 1]] = number;
      }
      const score = metrics[headline];
      delete metrics[headline];
      return { model: file.slice(0,-4), score, metrics };
    });
  },
};
export default board;
