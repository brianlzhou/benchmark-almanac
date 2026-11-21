// MultiFinGround tests multilingual financial fact extraction and concept recognition. Table 3
// lists T1 seven-class macro-F1 first, including an issuer-bootstrap 95% confidence interval.
// The strict protocol counts invalid outputs as wrong. Table 4 identifies the reasoning settings.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.19432';
const fields = ['EN','FR','EL','Text','T2a accuracy','T2b macro-F1','T2b exact set','T2c accuracy'];
const tasks = ['T1','T2a','T2b','T2c'];
const parts: Record<string,BoardPart> = {};
for (const [i,name] of fields.entries()) parts[name] = {name,group:i < 4 ? 'T1 macro-F1' : 'Multilingual evidence',unit:'%'};
for (const t of tasks) parts['invalid'+t] = {name:t,group:'Invalid outputs',unit:'%',better:'lower'};
const board: Leaderboard = {
  benchmark:'multifinground',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,
  headline:'The headline is the first task in Table 3, seven-class macro-F1 for financial fact identification.',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(url)).map(grid);
    const main = tables.find(t => t[0][1] === 'T1 (7-class macro-F1)' && t[1]?.join('|') === 'Model|All [95% CI]|EN|FR|EL|Text|Acc.|Macro-F1|Exact set|Acc.|T1/T2a/T2b/T2c');
    const models = tables.find(t => t[0].join('|') === 'Model|Group|Access|Reasoning in our runs');
    if (!main || !models) throw new Error('Missing MultiFinGround main tables');
    return checked(models.slice(1).map(([model,,,reasoning]) => {
      const r = main.find(row => row[0] === model);
      const ci = r?.[1].match(/^(\d+\.\d+) \[(\d+\.\d+), (\d+\.\d+)\]$/);
      if (!r || !ci) throw new Error('Missing score or interval for '+model);
      const invalid = r[10].split('/');
      if (invalid.length !== 4) throw new Error('Missing invalid rates for '+model);
      const metrics = Object.fromEntries(fields.map((name,i) => [name,numberCell(r[i+2])]));
      tasks.forEach((t,i) => metrics['invalid'+t] = numberCell(invalid[i]));
      return {model,setting:'Reasoning: '+reasoning,score:numberCell(ci[1]),low:numberCell(ci[2]),high:numberCell(ci[3]),metrics};
    }),15);
  },
};
export default board;
