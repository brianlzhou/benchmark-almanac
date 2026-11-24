// BelarusianGLUE evaluates Belarusian language understanding across five datasets.
// The paper reports no overall score. The headline is the plain mean of its six accuracy columns, in percent.
// Table 3 reports BERT model fine-tuning results across all six displayed task columns.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://aclanthology.org/2025.acl-long.25.pdf';
const terms = 'ACL Anthology paper, available under its published license: https://aclanthology.org/info/license/';

const board: Leaderboard = {
  benchmark: 'belarusianglue',
  static: 'paper',
  url: 'https://aclanthology.org/2025.acl-long.25/',
  feed: URL,
  terms,
  headline: 'The paper reports no overall score, so this is the plain mean of its six accuracy columns.',
  parts: {
    besls: 'BeSLS', belacolaId: 'BelaCoLA in domain', belacolaOod: 'BelaCoLA out of domain',
    bewic: 'BeWiC', bewsc: 'BeWSC', berteWd: 'BeRTE-WD',
  },
  async fetch() {
    const text = await pdfText(URL);
    const section = text.split('Dataset:   BeSLS')[1]?.split('Table 3: Results of BERT model fine-tuning.')[0];
    if (!section) throw new Error('BelarusianGLUE Table 3 missing');
    const pattern = /^\s*(.*?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*\/\s*(-?\d+\.\d+)\s+(\d+\.\d+)\s*\/\s*(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*$/;
    let family = '';
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === 'With pre-train' || trimmed === 'With pre-train & transfer') {
        family = trimmed;
        continue;
      }
      const match = line.match(pattern);
      if (!match) continue;
      const label = match[1].trim();
      const values = match.slice(2).map(Number);
      const isBase = ['mBERT', 'XLM-R', 'HPLT BERT be'].includes(label);
      const model = isBase ? label : 'mDeBERTa-v3';
      const setting = isBase ? undefined : (label === 'Original' ? 'Original' : `${family}, ${label}`);
      rows.push({
        model,
        setting,
        score: values.reduce((sum, value, index) => sum + (index === 2 || index === 4 ? 0 : value), 0) / 6 * 100,
        metrics: {
          besls: values[0] * 100,
          belacolaIdAccuracy: values[1] * 100,
          belacolaIdMcc: values[2],
          belacolaOodAccuracy: values[3] * 100,
          belacolaOodMcc: values[4],
          bewic: values[5] * 100,
          bewsc: values[6] * 100,
          berteWd: values[7] * 100,
        },
      });
    }
    return checked(rows, 10);
  },
};

export default board;
