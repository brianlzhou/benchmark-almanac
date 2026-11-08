// CRUXEval (Meta FAIR). crux-eval.github.io/leaderboard.html draws two tables from data.csv: output
// prediction (o@1, o@5) and input prediction (i@1, i@5), pass@1 and pass@5 in percent. The output table comes
// first and CRUXEval-O pass@1 is the figure model cards cite most, so o@1 is the score. A "+cot" suffix
// marks a chain-of-thought run and becomes the setting. Notes such as "(n=3)" (samples per problem) and
// "(under verification)" are dropped from the name. The output table's o@5 is kept as metrics.pass5.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://crux-eval.github.io/data.csv';

const board: Leaderboard = {
  benchmark: 'cruxeval',
  url: 'https://crux-eval.github.io/leaderboard.html',
  feed: `${FEED} (o@1, CRUXEval-O pass@1)`,
  terms: 'Static CSV on the CRUXEval GitHub Pages site; the cruxeval repository is MIT-licensed.',
  aliases: {
    'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'gpt-4-turbo-2024-04-09': 'gpt-4-turbo-apr-2024',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r['o@1']);
      if (!r.Model || !Number.isFinite(score)) continue;
      let model = r.Model.replace(/\s*\((n=\d+|under verification)\)/g, '').trim();
      const cot = /\+cot$/i.test(model);
      if (cot) model = model.replace(/\+cot$/i, '');
      // plain "gpt-4o" does not say which snapshot ran, and the resolver would pick the newest; retain it as an unlisted entry
      if (model === 'gpt-4o') model += ' (snapshot unspecified)';
      const pass5 = r['o@5'] ? Number(r['o@5']) : NaN;
      rows.push({ model, score, setting: cot ? 'CoT' : undefined, metrics: { ...(Number.isFinite(pass5) ? { pass5 } : {}), ...(Number.isFinite(Number(r['i@1'])) ? { inputPass1: Number(r['i@1']) } : {}), ...(r['i@5'] && Number.isFinite(Number(r['i@5'])) ? { inputPass5: Number(r['i@5']) } : {}) } });
    }
    if (!rows.length) throw new Error('no rows in data.csv');
    return rows;
  },
};
export default board;
