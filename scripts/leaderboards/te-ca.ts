// TE-ca is a Catalan language model evaluation suite covering named entities, POS, similarity, classification and QA.
// The paper reports no overall score. The headline is the first NERC F1 column, with other task scores retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2107.07903';
const board: Leaderboard = { benchmark: 'te-ca', static: 'paper', url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',
  headline: 'The paper reports no overall score, so this is the NERC F1 column, which appears first in its main results table.',
  parts: { nerc: { name: 'NERC', group: 'Task' }, pos: { name: 'POS', group: 'Task' }, sts: { name: 'STS', group: 'Task' }, tc: { name: 'TC', group: 'Task' }, viquiEm: { name: 'ViquiQuAD exact match', group: 'Question answering' }, viquiF1: { name: 'ViquiQuAD F1', group: 'Question answering' }, xquadEm: { name: 'XQuAD-ca exact match', group: 'Question answering' }, xquadF1: { name: 'XQuAD-ca F1', group: 'Question answering' } },
  async fetch() {
    const ts = tables(await paperHtml(FEED));
    const t = ts.find(t => t[0]?.[0]?.text === 'model' && t[0]?.some(c => c.text === 'NERC'));
    if (!t) throw new Error('Missing TE-ca results table');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text.trim(); if (!model) continue;
      const qaV = (r[5]?.text.match(/([\d.]+)\s*\/\s*([\d.]+)/) ?? []);
      const qaX = (r[6]?.text.match(/([\d.]+)\s*\/\s*([\d.]+)/) ?? []);
      const values = [num(r[1]?.text), num(r[2]?.text), num(r[3]?.text), num(r[4]?.text)];
      if (!values.every(v => v !== undefined) || !qaV[1] || !qaX[1]) continue;
      rows.push({ model, score: values[0] as number, metrics: { pos: values[1] as number, sts: values[2] as number, tc: values[3] as number, viquiEm: Number(qaV[1]), viquiF1: Number(qaV[2]), xquadEm: Number(qaX[1]), xquadF1: Number(qaX[2]) } });
    }
    if (rows.length < 2) throw new Error('TE-ca table yielded too few model rows');
    return rows;
  },
};
export default board;
