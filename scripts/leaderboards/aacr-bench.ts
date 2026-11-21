// AACR-Bench measures how well automated code reviews identify issues in pull requests.
// Table 3 gives semantic-match F1, precision and recall. Tables 4, 9 and 10 give additional breakdowns.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.19494';
const scopes = ['Diff','File','Repo'];
const issues = ['Security Vuln.','Code Defect','Performance','Maint. & Read.'];
const measures = ['Rec','Prec','F1'];
const parts = Object.fromEntries([...scopes.map(s=>[s,s+' recall']), ...issues.flatMap(s=>measures.map(m=>[s+m,s+': '+m]))]);
function numeric(s: string) {
  if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Invalid AACR-Bench value: '+s);
  return Number(s);
}
const board: Leaderboard = {
  benchmark: 'aacr-bench', url: feed, feed, static: 'paper', terms: PAPER_TERMS, parts,
  stats: {
    avgComments: { name: 'Average comments per pull request', unit: 'count' },
    recall: { name: 'Recall', unit: '%', better: 'higher' },
    precision: { name: 'Precision', unit: '%', better: 'higher' },
    lineRecall: { name: 'Line recall', unit: '%', better: 'higher' },
    linePrecision: { name: 'Line precision', unit: '%', better: 'higher' },
    lineF1: { name: 'Line F1', unit: '%', better: 'higher' },
  },
  aliases: { 'Claude-4.5-Sonnet': 'claude-sonnet-4-5', 'Qwen-480B-Coder': 'qwen3-coder-480b-a35b' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t=>t[0].join('|') === 'Method|Model|Avg Comments|Recall (%)|Precision (%)|F1 (%)');
    const scope = tables.find(t=>t[1]?.join('|') === 'Method|Model|Diff|File|Repo');
    const detail = tables.find(t=>t[1]?.slice(2).join('|') === '(per Patch)|Recall|Recall|Precision|Precision|F1|F1');
    const category = tables.find(t=>t[0].slice(2).join('|') === issues.flatMap(s=>[s,s,s]).join('|'));
    if (!main || !scope || !detail || !category || category[1].slice(2).join('|') !== issues.flatMap(()=>measures).join('|')) throw new Error('Missing AACR-Bench results columns');
    return checked(main.slice(1).map(([method,model,average,recall,precision,f1])=>{
      const context = scope.slice(2).find(r=>r[0]===method && r[1]===model);
      const lines = detail.slice(2).find(r=>r[1].toLowerCase()===method.toLowerCase() && r[0]===model);
      const groups = category.slice(2).find(r=>r[1].toLowerCase()===method.toLowerCase() && r[0]===model);
      if (!context || !lines || !groups) throw new Error('Missing breakdown for '+model+' '+method);
      const metrics: Record<string,number> = { avgComments:numeric(average),recall:numeric(recall),precision:numeric(precision),
        lineRecall:numeric(lines[3]),linePrecision:numeric(lines[5]),lineF1:numeric(lines[7]) };
      scopes.forEach((s,i)=>{ metrics[s] = numeric(context[i+2]); });
      issues.forEach((s,i)=>measures.forEach((m,j)=>{ metrics[s+m] = numeric(groups[2+3*i+j]); }));
      return { model, setting: method, harness: method === 'Agent' ? 'Claude Code' : undefined, metrics, score:numeric(f1) };
    }),20);
  },
};
export default board;
