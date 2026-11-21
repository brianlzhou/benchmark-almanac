// SOFC-Exp tests information extraction from solid oxide fuel cell experiment text.
// The headline is macro-average slot-identification F1 from Table 7 of the paper.
// The table compares named statistical and neural models on the test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2020.acl-main.116.pdf';
const board: Leaderboard = {
  benchmark: 'sofc-exp', static: 'paper', url: 'https://aclanthology.org/2020.acl-main.116/', feed: FEED,
  terms: 'The ACL Anthology paper is publicly available. Source attribution and ACL Anthology terms apply.',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(FEED);
    const start = text.indexOf('Table 7: Experiments: slot identification');
    if (start < 0) throw new Error('SOFC-Exp Table 7 missing');
    const section = text.slice(text.lastIndexOf('Model                  dev', start), start);
    const names = ['CRF','BiLSTM mat2vec','BiLSTM word2vec','+ mat2vec','+ bpe','+ BERT-base','+ SciBERT','BiLSTM BERT-base','BiLSTM SciBERT','BERT-base','SciBERT'];
    const rows: LeaderboardRow[] = [];
    for (const name of names) {
      const re = new RegExp('^\\s*' + name.replace(/[+]/g, '\\+') + '\\s+[^\\n]*?\\s(\\d+(?:\\.\\d+)?)\\s*$', 'm');
      const m = section.match(re);
      if (m) rows.push({ model: name, score: Number(m[1]) });
    }
    if (rows.length !== 11) throw new Error(`Expected 11 SOFC-Exp Table 7 rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
