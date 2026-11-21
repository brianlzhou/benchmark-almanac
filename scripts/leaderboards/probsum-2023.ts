// ProbSum evaluates problem lists from clinical progress notes by ROUGE-L F1. CodaLab’s published export includes precision and recall for each listed submitter.
import type { Leaderboard } from './types.ts';
import { fetchText,parseCsv } from '../lib/util.ts';

const FEED = "https://codalab.lisn.upsaclay.fr/competitions/12388/results/19799/data";

const board: Leaderboard = {
  benchmark: "probsum-2023",
  url: "https://codalab.lisn.upsaclay.fr/competitions/12388#results",
  feed: FEED,
  terms: "CodaLab lists entrants by username. The test results page gives no score reuse license. https://codalab.lisn.upsaclay.fr/competitions/12388/results/19799 The robots URL returns HTML.",
  async fetch() {
    const rows = parseCsv(await fetchText(FEED));
    if (rows.length < 10) throw new Error('Expected ten CodaLab submissions');
    return rows.map(r => {
      const read = (key:string) => {
        const m = r["b'"+key+"'"]?.match(/^([\d.]+) \(\d+\)$/);
        if (!m) throw new Error('Missing '+key); return Number(m[1]);
      };
      if (!r.User || !r.submission_pk) throw new Error('Missing submission identity');
      return { model:r.User, submitter:r.User, score:read('F1'), metrics:{ precision:read('Precision'), recall:read('Recall'), submissionId:Number(r.submission_pk) } };
    });
  },
};
export default board;
