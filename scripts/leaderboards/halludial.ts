// HalluDial reports macro F1 for detecting hallucinations in dialogue.
// Tables 7 and 8 of the paper give the full test scores and scores for each hallucination scenario.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2406.07070";


const board: Leaderboard = {
  benchmark: "halludial", static: 'paper',
  url: "https://github.com/flageval-baai/HalluDial",
  feed,
  terms: "The authors link their public paper from the repository. arXiv permits access to its HTML articles and requests paced reads.",
  parts: { hallucination: 'Hallucinatory F1', nonHallucination: 'Non-Hallucinatory F1', spontaneous: 'Spontaneous Hallucination Scenario', induced: 'Induced Hallucination Scenario' },
  stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' } },
  async fetch() {
    const html = await fetchText(feed);
    function table(id: string) {
      const i = html.indexOf('<figure id="' + id + '"');
      if (i < 0) throw new Error('Missing HalluDial table ' + id);
      const figure = html.slice(i, html.indexOf('</figure>', i));
      const native = tables(figure)[0];
      if (native) return native.map(r => r.map(c => c.text));
      return figure.split(/<span[^>]*class="ltx_tr"[^>]*>/).slice(1).map(row =>
        row.split(/<span[^>]*class="ltx_td\b[^"]*"[^>]*>/).slice(1).map(cell => text(cell)));
    }
    const whole = table('A2.T7'), splits = table('A2.T8');
    if (whole[1]?.at(-1) !== 'Macro F1' || splits[1]?.length !== 9) throw new Error('HalluDial changed the headers');
    const rows = whole.slice(2).map(([model, h, n, a, p, r, f]) => {
      const pair = splits.find(s => s[0] === model);
      if (![h,n,a,p,r,f,...(pair ? [pair[4],pair[8]] : [])].every(v => v && Number.isFinite(Number(v)))) throw new Error('Incomplete scores for ' + model);
      return { model, score: Number(f), metrics: { hallucination: Number(h), nonHallucination: Number(n), accuracy: Number(a), precision: Number(p), recall: Number(r), ...(pair ? {spontaneous: Number(pair[4]), induced: Number(pair[8])} : {}) } };
    });
    if (rows.length < 21) throw new Error('Missing HalluDial models');
    return rows;
  },
};
export default board;
