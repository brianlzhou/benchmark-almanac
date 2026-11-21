// MemEye publishes the full evaluation matrix for four backbones in appendix tables 16 through 19.
// The score is converted from a fraction to percent. Avg. exact match remains a metric. Memory methods remain harnesses.
// These are the paper's static results and will not refresh with new model releases.
import type { BoardStat, Leaderboard, LeaderboardRow} from './types.ts';
import { num } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2605.15128";
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
const stats: Record<string, BoardStat> = Object.fromEntries(['exactMatch','bleu1',...['Y1','Y2','Y3'].flatMap(y=>['X1','X2','X3','X4'].flatMap(x=>[`exactMatch${y}${x}`,`bleu1${y}${x}`]))].map(key=>[key,{name:key==='exactMatch'?'Exact match':key==='bleu1'?'BLEU-1':key.replace(/^(exactMatch|bleu1)(Y\d)(X\d)$/,(match,metric,y,x)=>`${metric==='exactMatch'?'Exact match':'BLEU-1'} ${y} ${x}`),unit:'%',better:'higher' as const}]));
const board: Leaderboard = {
  benchmark: "memeye", static: 'paper',
  url: "https://minghokwok.github.io/MemEye/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  stats,
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = await paperTables(FEED);
    const models = ['GPT-5.4-mini', 'GPT-4.1-nano', 'Qwen3-VL-8B-Instruct', 'gemini-2.5-flash-lite'];
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const [i, model] of models.entries()) {
      const table = tables[16 + i];
      if (table?.[0]?.[2]?.text !== 'Metric' || table.at(-1)?.[0]?.text !== 'LLM-Judge') {
        throw new Error('MemEye appendix matrix changed for ' + model);
      }
      for (const [j, method] of table[1].entries()) {
        const metrics: Record<string, number> = {};
        let depth = '', granularity = '', score: number | undefined;
        for (const row of table.slice(2)) {
          const k = row.findIndex(c => ['EM', 'BLEU-1', 'LLM-Judge'].includes(c.text));
          if (k < 0) continue;
          for (const cell of row.slice(0, k)) {
            if (/^Y\d+$/.test(cell.text) || cell.text === 'Avg.') depth = cell.text;
            if (/^X\d+$/.test(cell.text)) granularity = cell.text;
          }
          const value = num(row[k + j + 1]?.text);
          if (value === undefined) continue;
          const pct = Number((100 * value).toFixed(2));
          const metric = row[k].text;
          const key = metric === 'EM' ? 'exactMatch' : metric === 'BLEU-1' ? 'bleu1' : 'judge';
          if (depth === 'Avg.') {
            if (key === 'judge') score = pct;
            else metrics[key] = pct;
          } else {
            const part = depth.toLowerCase() + granularity;
            if (key === 'judge') {
              parts[part] = {name: depth + ' / ' + granularity, group: 'Evaluation matrix'};
              metrics[part] = pct;
            } else metrics[key + depth + granularity] = pct;
          }
        }
        if (score !== undefined) rows.push({model, harness: method.text, score, metrics});
      }
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
