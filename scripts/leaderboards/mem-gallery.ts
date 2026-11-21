// Mem-Gallery tests memory across multimodal conversations. Tables 3 and 8 to 13 report overall F1 first.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2601.03515";
const tasks = ['FR','VS','TTL','TR','VR','MR','KR','CD','AR'];
const taskNames: Record<string,string> = {FR:'Factual retrieval',VS:'Visual-centric search',TTL:'Test-time learning',TR:'Temporal reasoning',VR:'Visual-centric reasoning',MR:'Multi-entity reasoning',KR:'Knowledge resolution',CD:'Conflict detection',AR:'Answer refusal'};
const memParts = Object.fromEntries(tasks.map(task => [task + 'F1', task + ' F1']));
const memStats = Object.fromEntries(tasks.flatMap(task => [
  [task + 'BLEU1', {name: taskNames[task] + ' BLEU-1', unit:'%', better:'higher'}],
  [task + 'EM', {name: taskNames[task] + ' exact match', unit:'%', better:'higher'}],
  [task + 'LLMJudge', {name: taskNames[task] + ' LLM judge score', unit:'%', better:'higher'}],
]).concat([
  ['OverallBLEU1', {name:'Overall BLEU-1', unit:'%', better:'higher'}],
  ['OverallEM', {name:'Overall exact match', unit:'%', better:'higher'}],
  ['OverallLLMJudge', {name:'Overall LLM judge score', unit:'%', better:'higher'}],
]));
const board: Leaderboard = {
  benchmark: "mem-gallery", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2601.03515.',
  parts: memParts, stats: {...memStats, OverallF1: {name:'Overall F1', unit:'%', better:'higher'}}, harnesses: 'system',
  aliases: { 'Qwen-2.5-VL-3B': 'qwen2-5-vl-3b', 'Qwen-2.5-VL-7B': 'qwen2-5-vl-7b' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = tables.filter(t => t[0]?.includes('MuRAG') && t.some(r => r[0] === 'Overall' && r[2] === 'F1'));
    const rows: LeaderboardRow[] = [];
    for (const t of results) {
      const [model, k] = t[0][0].split(' (K=');
      const setting = k ? 'K=' + k.replace(')', '') : 'K=10';
      for (const [i, harness] of t[0].entries()) {
        if (i < 3) continue;
        const metrics: Record<string, number> = {};
        for (const [, task, measure, ...values] of t.slice(1)) {
          const key = task + measure.replace(/-/g, '');
          metrics[key] = Number((100 * numberCell(values[i-3])).toFixed(2));
          if (task !== 'Overall' && measure === 'F1') board.parts![key] = task + ' F1';
        }
        if (Object.keys(metrics).length !== 40) throw new Error('Missing memory task or measure');
        rows.push({model, harness, setting, score: metrics.OverallF1, metrics});
      }
    }
    return checked(rows, 91);
  },
};
export default board;
