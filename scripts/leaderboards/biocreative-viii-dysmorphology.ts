// BioCreative ranks phenotype normalization systems by normalized F1.
// The CodaLab export includes exact and overlap extraction results in its scored table.
import type { Leaderboard } from './types.ts';
import { parseCsv, fetchText } from '../lib/util.ts';

const feed = "https://codalab.lisn.upsaclay.fr/competitions/11351/results/18458/data";
const board: Leaderboard = {
  benchmark: "biocreative-viii-dysmorphology",
  url: "https://codalab.lisn.upsaclay.fr/competitions/11351#results",
  feed,
  terms: "The terms authorize organizers to release scores at the workshop and in its proceedings. They do not specify broader score reuse. CodaLab returned 404 for robots.txt.",
  parts: { exactF1: 'Exact extraction and normalization F1', overlapF1: 'Overlap extraction and normalization F1' },
  stats: {
    precision: { name: 'Normalized precision', unit: 'score', better: 'higher' },
    recall: { name: 'Normalized recall', unit: 'score', better: 'higher' },
    exactPrecision: { name: 'Exact extraction and normalization precision', unit: 'score', better: 'higher' },
    exactRecall: { name: 'Exact extraction and normalization recall', unit: 'score', better: 'higher' },
    overlapPrecision: { name: 'Overlap extraction and normalization precision', unit: 'score', better: 'higher' },
    overlapRecall: { name: 'Overlap extraction and normalization recall', unit: 'score', better: 'higher' },
  },
  async fetch() {
    const raw = await fetchText(feed);
    const section = raw.split(/(?=^submission_pk,)/m).find(t => t.split('\n')[0].includes("b'exact Ext/Norm F1'"));
    if (!section) throw new Error('Missing scored extraction and normalization table');
    const rows = parseCsv(section).map(r => {
      const value = (field: string) => {
        const m = r["b'" + field + "'"]?.match(/^(\d+(?:\.\d+)?) \(\d+\)$/);
        if (!m) throw new Error('Missing score for ' + field);
        return Number(m[1]);
      };
      if (!r.User) throw new Error('Missing team');
      return { model: r.User, submitter: r.User, score: value('Norm. F1'),
        metrics: { precision: value('Norm. P'), recall: value('Norm. R'),
          exactF1: value('exact Ext/Norm F1'), exactPrecision: value('exact Ext/Norm P'), exactRecall: value('exact Ext/Norm R'),
          overlapF1: value('over Ext/Norm F1'), overlapPrecision: value('over Ext/Norm P'), overlapRecall: value('over Ext/Norm R') } };
    });
    if (rows.length < 2) throw new Error('Missing scored teams');
    return rows;
  },
};
export default board;
