// Swiss-Judgment-Prediction classifies Swiss court decisions as approval or dismissal.
// The paper reports Micro-F1 for German, French and Italian, with no overall score.
// The headline is the plain mean of the three language Micro-F1 parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://arxiv.org/html/2110.00806';
const board: Leaderboard = {
  benchmark: 'swiss-judgment-prediction', static: 'paper',
  url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. The table is attributed to the paper authors.',
  headline: 'The paper reports no overall score, so this is the plain mean of its three language Micro-F1 scores.',
  parts: {
    de: { name: 'German', group: 'Language' },
    fr: { name: 'French', group: 'Language' },
    it: { name: 'Italian', group: 'Language' },
  },
  async fetch() {
    const ts = tables(await fetchText(FEED));
    const out: LeaderboardRow[] = [];
    const table = ts.find(t => t[0]?.[0]?.text === 'Model' && t[1]?.some(c => /Micro-F1/.test(c.text)));
    if (!table) throw new Error('Missing Swiss-Judgment-Prediction results table');
    let setting = '';
    for (const row of table.slice(2)) {
      const label = row[0]?.text.trim() ?? '';
      if (/^(standard|long|hierarchical) /.test(label)) { setting = label; continue; }
      if (!/^(Native BERT|Multilingual BERT)$/.test(label)) continue;
      const values = [num(row[1]?.text ?? ''), num(row[4]?.text ?? ''), num(row[7]?.text ?? '')];
      if (!values.every(v => v !== undefined)) continue;
      out.push({ model: label, setting,
        score: values.reduce((a, b) => a + (b as number), 0) / values.length,
        metrics: { de: values[0] as number, fr: values[1] as number, it: values[2] as number } });
    }
    if (out.length < 2) throw new Error('Swiss-Judgment-Prediction table yielded fewer than two models');
    return out;
  },
};
export default board;
