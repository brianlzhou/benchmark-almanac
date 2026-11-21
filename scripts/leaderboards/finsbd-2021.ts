// FinSBD ranks financial document structure detectors by macro F1.
// The CodaLab export includes scores for individual document structures, including two columns labeled item.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const feed = "https://competitions.codalab.org/competitions/28485/results/46733/data";
const board: Leaderboard = {
  benchmark: "finsbd-2021",
  url: "https://competitions.codalab.org/competitions/28485#results",
  feed,
  terms: "The competition terms do not give a separate score reuse license. CodaLab returned 404 for robots.txt.",
  parts: { sentence: 'Sentence', list: 'List', table: 'Table', figure: 'Figure', header: 'Header', footer: 'Footer', itemFirst: 'Item (first column)', itemSecond: 'Item (second column)', item2: 'Item2', item3: 'Item3', item4: 'Item4' },
  async fetch() {
    const raw = await fetchText(feed);
    const header = 'submission_pk,User,macro F1,sentence,list,table,figure,header,footer,item,item,item2,item3,item4';
    if (raw.split(/\r?\n/)[0] !== header) throw new Error('Unexpected FinSBD columns');
    const rows = parseCsv(raw.replace(header, header.replace('item,item,', 'itemFirst,itemSecond,')));
    if (rows.length < 5) throw new Error('Missing FinSBD submissions');
    return rows.map(r => {
      const value = (key: string) => {
        const m = r[key]?.match(/^(\d+(?:\.\d+)?) \(\d+\)$/);
        if (!m) throw new Error('Invalid FinSBD result in ' + key);
        return Number(m[1]);
      };
      if (!r.User) throw new Error('Missing submitter');
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(board.parts!)) {
        if (!/^NaN \(\d+\)$/.test(r[key])) metrics[key] = value(key);
      }
      return { model: r.User, submitter: r.User, score: value('macro F1'), metrics };
    });
  },
};
export default board;
