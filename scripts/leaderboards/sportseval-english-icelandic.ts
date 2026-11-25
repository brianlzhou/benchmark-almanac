// SportsEval scores the percentage of correctly translated sports terms. The revised all-systems TSV includes domain scores and consistency counts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/stofnun-arna-magnussonar/SportsEval/main/evaluation/automatic/autoeval_allsystems.tsv";
const board: Leaderboard = {
  benchmark: 'sportseval-english-icelandic',
  url: "https://github.com/stofnun-arna-magnussonar/SportsEval/blob/main/evaluation/automatic/autoeval_allsystems.tsv",
  feed,
  terms: "GitHub requests a one-second delay and the raw host has no robots file. Revised string matching across 717 term occurrences. Keep WMT25 paper scores separate. Data CC BY 4.0. https://github.com/stofnun-arna-magnussonar/SportsEval#license",
  parts: {
    'Chess terms': 'Chess terms',
    'Basketball terms': 'Basketball terms',
    'Golf terms': 'Golf terms',
    'Gymnastics terms': 'Gymnastics terms',
    'Football terms': 'Football terms',
  },
  stats: {
    'overall.terms_found': { name: 'Overall terms found', unit: 'count', better: 'higher' },
    'overall.sentences_all_correct': { name: 'Overall fully correct sentences', unit: 'count', better: 'higher' },
    'overall.multi_terms_always_correct': { name: 'Overall fully correct multi-term sentences', unit: 'count', better: 'higher' },
    'Multiterms consistency': { name: 'Multi-term consistency', unit: '%', better: 'higher' },
    'domain.chess.terms_found': { name: 'Chess terms found', unit: 'count', better: 'higher' }, 'domain.chess.sentences_all_correct': { name: 'Chess fully correct sentences', unit: 'count', better: 'higher' }, 'domain.chess.multi_terms_always_correct': { name: 'Chess fully correct multi-term sentences', unit: 'count', better: 'higher' },
    'domain.basketball.terms_found': { name: 'Basketball terms found', unit: 'count', better: 'higher' }, 'domain.basketball.sentences_all_correct': { name: 'Basketball fully correct sentences', unit: 'count', better: 'higher' }, 'domain.basketball.multi_terms_always_correct': { name: 'Basketball fully correct multi-term sentences', unit: 'count', better: 'higher' },
    'domain.golf.terms_found': { name: 'Golf terms found', unit: 'count', better: 'higher' }, 'domain.golf.sentences_all_correct': { name: 'Golf fully correct sentences', unit: 'count', better: 'higher' }, 'domain.golf.multi_terms_always_correct': { name: 'Golf fully correct multi-term sentences', unit: 'count', better: 'higher' },
    'domain.gymnastics.terms_found': { name: 'Gymnastics terms found', unit: 'count', better: 'higher' }, 'domain.gymnastics.sentences_all_correct': { name: 'Gymnastics fully correct sentences', unit: 'count', better: 'higher' }, 'domain.gymnastics.multi_terms_always_correct': { name: 'Gymnastics fully correct multi-term sentences', unit: 'count', better: 'higher' },
    'domain.football.terms_found': { name: 'Football terms found', unit: 'count', better: 'higher' }, 'domain.football.sentences_all_correct': { name: 'Football fully correct sentences', unit: 'count', better: 'higher' }, 'domain.football.multi_terms_always_correct': { name: 'Football fully correct multi-term sentences', unit: 'count', better: 'higher' },
  },
  async fetch() {
    const [header, ...lines] = (await fetchText(feed)).trim().split(/\r?\n/);
    const fields = header.split('\t'), headline = 'Correct Terms (string match)';
    const domains = ['Chess', 'Basketball', 'Golf', 'Gymnastics', 'Football'];
    if (fields[0] !== 'file_name' || ![headline, ...domains.map(d => d + ' terms')].every(h => fields.includes(h)) || lines.length < 34) throw new Error('Missing SportsEval standings');
    return lines.map(line => {
      const [file, ...values] = line.split('\t');
      if (!file.endsWith('.txt') || values.length !== fields.length - 1) throw new Error('Incomplete SportsEval row');
      const metrics: Record<string, number> = {};
      for (const [i, value] of values.entries()) {
        const number = Number(value.replace(/%$/, ''));
        if (!value || !Number.isFinite(number)) throw new Error('Invalid SportsEval value for ' + file);
        const key = fields[i + 1];
        if (!/\.(?:terms_total|multi_terms)$/.test(key)) metrics[key] = number;
      }
      const score = metrics[headline];
      delete metrics[headline];
      return { model: file.slice(0,-4), score, metrics };
    });
  },
};
export default board;
