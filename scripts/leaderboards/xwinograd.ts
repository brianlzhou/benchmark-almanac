// XWinograd tests multilingual pronoun resolution. Tables 2 and 3 report average accuracy for each
// model and training method, with per-language accuracy and standard deviations across five supervised splits.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2021.findings-acl.310.pdf';
const parts = { en: 'English', fr: 'French', ja: 'Japanese', ru: 'Russian', zh: 'Chinese', pt: 'Portuguese' };
const board: Leaderboard = {
  benchmark: 'xwinograd', feed, url: feed, static: 'paper', parts,
  terms: 'ACL Anthology terms apply to the authors’ paper. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    const header = /Model\s+Train lang\s+en\s+fr\s+ja\s+ru\s+zh\s+pt\s+Avg/g;
    for (const match of paper.matchAll(header)) {
      const table = paper.slice(match.index! + match[0].length).match(/^([\s\S]*?)Table [23]: Results for (multilingual BERT|XLM-R-Large),/);
      if (!table || !table[1].includes('Kocijan et al. (2019)') || !table[1].includes('Ours')) throw new Error('Missing XWinograd comparison');
      const model = table[2];
      let supervisedRows = 0;
      for (const line of table[1].trim().split('\n')) {
        const cells = line.trim().split(/\s+/);
        if (cells.length < 8) continue;
        const values = cells.splice(-7);
        const label = cells.join(' ');
        const supervised = Object.hasOwn(parts, label);
        const setting = supervised ? (supervisedRows++ < 6 ? 'Kocijan et al. (2019)' : 'Attention-head classifier') + ', trained on ' + label :
          label.replace(/ -$/, '');
        const metrics: Record<string, number> = {};
        Object.keys(parts).forEach((key, i) => {
          if (values[i] === '-' && label === key) return;
          const m = values[i].match(/^(\d+(\.\d+)?)(?:±(\d+(\.\d+)?))?$/);
          if (!m) throw new Error('Unrecognized accuracy: ' + values[i]);
          metrics[key] = Number(m[1]);
          if (m[3]) metrics[key + 'Std'] = Number(m[3]);
        });
        rows.push({ model, setting, score: Number(values[6]), trials: supervised ? 5 : undefined, metrics });
      }
      if (supervisedRows !== 12) throw new Error('Expected two methods trained on six languages');
    }
    return checked(rows, 30);
  },
};
export default board;
