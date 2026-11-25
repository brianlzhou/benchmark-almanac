// LongMemEval measures question-answering accuracy on conversation histories. The paper reports fractions for each history and reading setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2410.10813';

const board: Leaderboard = {
  benchmark: 'longmemeval', static: 'paper',
  url: 'https://arxiv.org/abs/2410.10813',
  feed: FEED,
  terms: PAPER_TERMS,
  stats: {
    dropPercent: { name: 'Accuracy drop from Oracle', unit: '%', better: 'lower' },
    recall: { name: 'Retrieval recall', unit: '%', better: 'higher' },
    ndcg: { name: 'Retrieval NDCG', unit: '%', better: 'higher' },
  },
  aliases: {"Llama 3.1 Instruct 70B": "llama-3-1-70b", "Llama 3.1 Instruct 8B": "llama-3-1-8b", "Llama-3.2-3B-Instruct": "llama-3-2-3b", "Llama-3.2-1B-Instruct": "llama-3-2-1b", "Phi-3 128k Instruct 14B": "phi-3-medium-128k-instruct", "Phi-3.5 Mini Instruct 4B": "phi-3-5-mini", "Phi-3.5-mini-instruct": "phi-3-5-mini", "Mistral-Nemo-Instruct-2407": "mistral-nemo"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const rows: LeaderboardRow[] = [];
    const paramsByModel = new Map<string, number>();
    const pct = (v: string) => Math.round(Number(v) * 10000) / 100;
    function add(model: string, setting: string, value: string, extra?: { params?: number; metrics?: Record<string, number> }) {
      if (!/^0\.\d+$|^1(?:\.0+)?$/.test(value)) throw new Error('Invalid LongMemEval accuracy');
      const params = extra?.params ?? paramsByModel.get(model);
      rows.push({ model, setting, score: pct(value), ...(params !== undefined ? { params } : {}), ...(extra?.metrics ? { metrics: extra.metrics } : {}) });
    }
    const main = tables.find(t => t[0]?.join('|') === 'Model|Size|Oracle|S|% Drop');
    const extra = tables.find(t => t[0]?.includes('LongMemEval M') && t[1]?.includes('LC Direct'));
    if (!main || !extra || extra[1].length !== 9) throw new Error('Missing LongMemEval comparison');
    let method = '';
    for (const [name, size, oracle, small, drop] of main.slice(1)) {
      if (name === size) { method = name; continue; }
      const model = size === '-' ? name : name + ' ' + size;
      const paramsMatch = size.match(/^(\d+(?:\.\d+)?)B$/i);
      const params = paramsMatch ? Number(paramsMatch[1]) : undefined;
      if (params !== undefined) paramsByModel.set(model, params);
      const dropMatch = drop?.match(/(\d+(?:\.\d+)?)%/);
      const dropPercent = dropMatch ? Number(dropMatch[1]) : undefined;
      add(model, 'Oracle / ' + method, oracle, { params });
      add(model, 'LongMemEval S / ' + method, small, { params, ...(dropPercent !== undefined ? { metrics: { dropPercent } } : {}) });
    }
    for (const [model, ...values] of extra.slice(2)) {
      if (values.length !== 8) throw new Error('Incomplete LongMemEval condition');
      values.forEach((value, i) => add(model, extra[0][i + 1] + ' / ' + extra[1][i + 1], value));
    }
    const retrieval = tables.filter(t => t[0]?.includes('End-to-End QA') && t[1]?.includes('L3.1 70B'));
    if (retrieval.length !== 2) throw new Error('Missing retrieval comparison');
    for (const table of retrieval) {
      let granularity = '';
      for (const cells of table.slice(3)) {
        if (cells[0].startsWith('Value =')) { granularity = cells[0]; continue; }
        if (table === retrieval[1] && !cells[0].endsWith('(RM)')) continue;
        for (let i = 5; i < 11; i++) {
          const name = table[1][i].replace('L3.1 ', 'Llama 3.1 Instruct ');
          const topK = table[2][i];
          const [rIdx, nIdx] = topK === 'Top-5' ? [1, 2] : [3, 4];
          const metrics: Record<string, number> = {};
          if (/^0\.\d+$|^1(?:\.0+)?$/.test(cells[rIdx])) metrics.recall = pct(cells[rIdx]);
          if (/^0\.\d+$|^1(?:\.0+)?$/.test(cells[nIdx])) metrics.ndcg = pct(cells[nIdx]);
          add(name, ['LongMemEval M', granularity, cells[0], topK].join(' / '), cells[i], Object.keys(metrics).length ? { metrics } : undefined);
        }
      }
    }
    if (rows.length < 162) throw new Error('Incomplete LongMemEval results');
    return rows;
  },
};
export default board;
