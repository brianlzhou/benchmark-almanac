// CWEval tests whether generated code passes functional and security checks. The paper gives func-sec@1 and five related rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2501.08200';

const board: Leaderboard = {
  benchmark: 'cweval', static: 'paper',
  url: 'https://arxiv.org/abs/2501.08200',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"GPT-4o": "gpt-4o-aug-2024", "Claude 3.5 Sonnet": "claude-3-5-sonnet-october-2024", "Gemini 1.5 Pro": "gemini-1-5-pro-sept-2024", "Gemini 1.5 Flash": "gemini-1-5-flash-sep-2024", "Llama 3.1 405B Instruct": "llama-3-1-405b", "Llama 3.1 70B Instruct": "llama-3-1-70b", "Llama 3.1 8B Instruct": "llama-3-1-8b"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const header = '|func@1|func@10|func@50|func-sec@1|func-sec@10|func-sec@50';
    const found = tables.filter(t => t[0]?.join('|') === header);
    if (found.length !== 2) throw new Error('Missing CWEval comparison');
    const rows = new Map<string, LeaderboardRow>();
    const keys = ['func1','func10','func50','funcSec1','funcSec10','funcSec50'];
    board.parts = Object.fromEntries(keys.map((k, i) => [k, found[0][0][i+1]]));
    for (const table of found) {
      for (const [label, ...values] of table.slice(1)) {
        const [model, mode] = label.split(' w/ ');
        if (values.length !== 6 || values.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Incomplete CWEval metrics');
        const setting = (mode ?? 'Default').replace(/\s*\[.*\]/, '') + ', temperature 0.8';
        const metrics = Object.fromEntries(keys.map((k, i) => [k, Number(values[i])]));
        rows.set(label, { model, setting, score: metrics.funcSec1, trials: 100, metrics });
      }
    }
    if (rows.size < 15) throw new Error('Incomplete CWEval results');
    return [...rows.values()];
  },
};
export default board;
