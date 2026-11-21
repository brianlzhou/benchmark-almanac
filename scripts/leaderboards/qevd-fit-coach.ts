// The fitness workshop ranks teams by the number of evaluation metrics they lead.
// Its winners table lists the five higher-is-better measures used to decide the competition.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://varworkshop.github.io/challenges/";

const board: Leaderboard = {
  benchmark: "qevd-fit-coach",
  url: "https://varworkshop.github.io/challenges/",
  feed,
  terms: "The workshop page gives no separate score reuse terms. robots.txt allows the feed path.",
  async fetch() {
    const doc = await fetchText(feed);
    const names = ['METEOR', 'ROUGE-L', 'BERT', 'LLM-Acc', 'T-F-Score'];
    const table = tables(doc).find(t => t[0].map(c => c.text).join('|') === ['Team', ...names.map(n => n + '↑')].join('|'));
    if (!table || table.length < 3) throw new Error('Missing fitness winners');
    const rows = table.slice(1).map(cells => {
      const values = cells.slice(1).map(c => Number(c.text || NaN));
      if (values.length !== names.length || !values.every(Number.isFinite)) throw new Error('Invalid fitness results');
      return { model: cells[0].text, values };
    });
    return rows.map(({model, values}) => ({
      model, submitter: model, score: values.filter((v, i) => rows.every(r => r.values[i] <= v)).length,
      metrics: Object.fromEntries(names.map((n, i) => [n, values[i]])),
    }));
  },
};
export default board;
