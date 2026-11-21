// ToLD-Br is a multilabel Brazilian toxic-language benchmark.
// The paper reports macro F1 for five model pipelines in separate result tables.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { tables, num } from '../lib/html.ts';
const FEED = 'https://arxiv.org/html/2010.04543';
const board: Leaderboard = { benchmark: 'told-br', static: 'paper', url: FEED, feed: FEED,
  terms: 'arXiv permits these HTML paths under robots.txt. Results are attributed to the paper authors.',
  async fetch() {
    const ts = tables(await paperHtml(FEED));
    const models = ['BoW + AutoML', 'BR-BERT', 'M-BERT-BR', 'M-BERT(transfer)', 'M-BERT(zero-shot)'];
    const rows: LeaderboardRow[] = [];
    for (let i = 0; i < models.length; i++) {
      const t = ts[6 + i]; if (!t) continue;
      const macro = t.find(r => r[0]?.text.trim() === 'Macro Avg');
      const score = num(macro?.[3]?.text ?? ''); if (score === undefined) continue;
      rows.push({ model: models[i], score: score * 100 });
    }
    if (rows.length < 2) throw new Error('Missing ToLD-Br model result tables');
    return rows;
  },
};
export default board;
