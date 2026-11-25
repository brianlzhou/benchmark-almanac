import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2512.12730';
const board: Leaderboard = {
  benchmark: 'nl2repo-bench', static: 'paper', stats: {
    fullyPassedTasks: { name: 'Fully passed tasks', unit: 'count', better: 'higher' },
    easyFullyPassed: { name: 'Easy fully passed tasks', unit: 'count', better: 'higher' },
    mediumFullyPassed: { name: 'Medium fully passed tasks', unit: 'count', better: 'higher' },
    hardFullyPassed: { name: 'Hard fully passed tasks', unit: 'count', better: 'higher' },
    meanTurns: { name: 'Mean interaction turns', unit: 'count' },
    maxTurns: { name: 'Maximum observed turns', unit: 'count' },
    turnsPerScore: { name: 'Turns per score point', unit: 'score', better: 'lower' },
    'toolUses:str_replace_editor': { name: 'Editor tool uses', unit: 'count' },
    'toolUses:execute_bash': { name: 'Bash tool uses', unit: 'count' },
    'toolUses:task_tracker': { name: 'Task tracker tool uses', unit: 'count' },
    'toolUses:Other': { name: 'Other tool uses', unit: 'count' },
    'toolUses:Total': { name: 'Total tool uses', unit: 'count' },
    'toolUses:Avg/Task': { name: 'Average tool uses per task', unit: 'count' },
  }, parts: {
  easy: { name: 'Easy', group: 'Difficulty' },
  medium: { name: 'Medium', group: 'Difficulty' },
  hard: { name: 'Hard', group: 'Difficulty' },
  'Web Dev': { name: 'Web development', group: 'Domain' },
  Testing: { name: 'Testing', group: 'Domain' },
  'Utility Libs': { name: 'Utility libraries', group: 'Domain' },
  Network: { name: 'Network', group: 'Domain' },
  ML: { name: 'Machine learning', group: 'Domain' },
  'Data Proc.': { name: 'Data analysis and processing', group: 'Domain' },
  'DB Interact.': { name: 'Database interaction', group: 'Domain' },
  'Batch Ops': { name: 'Batch file processing', group: 'Domain' },
  'Sys Tools': { name: 'System tools', group: 'Domain' },
}, url: URL, feed: URL + ' (overall test pass rate)', terms: PAPER_TERMS,
  async fetch() {
    const ts = flatPaperTables(await paperHtml(URL)).map(grid);
    const t = ts.find(t => t[0]?.[1] === 'Overall' && t[0]?.[2] === 'Pass@1');
    const categories = ts.find(t => t[0]?.[1] === 'Web Dev');
    const turns = ts.find(t => t[0]?.[1] === 'Avg.' && t[1]?.[1] === 'Turns');
    if (!t || !categories || !turns) throw new Error('NL2Repo result tables missing');
    const tools = ts.find(t => t[0]?.[0] === 'Tool' && t[0]?.includes('GPT-5'));
    const rows = t.slice(2).map(r => {
      const m = r[0].match(/^(.*?)(?: \(([^)]+)\))?$/)!;
      const metrics: Record<string, number> = {fullyPassedTasks: Number(r[2]), easy: Number(r[3]), medium: Number(r[4]), hard: Number(r[5])};
      let header = categories[0];
      for (const c of categories.slice(1)) {
        if (c[0] === 'Model') header = c;
        else if (c[0] === r[0]) c.slice(1).forEach((v, i) => {if (Number.isFinite(parseFloat(v))) metrics[header[i + 1]] = parseFloat(v);});
      }
      const n = turns.find(x => x[0].toLowerCase() === r[0].toLowerCase());
      if (n) { metrics.meanTurns = Number(n[1]); metrics.turnsStd = Number(n[2]); metrics.maxTurns = Number(n[3]); metrics.turnsPerScore = Number(n[5]); }
      if (tools && !m[2]) {
        const col = tools[0].findIndex((h, i) => (h + (tools[1][i] ?? '')).toLowerCase() === m[1].toLowerCase());
        if (col > 0) for (const cells of tools.slice(2)) {
          const cell = cells[col]?.replace(/,/g, '');
          if (cell && Number.isFinite(Number(cell))) metrics['toolUses:' + cells[0]] = Number(cell);
        }
      }
      return {model: m[1], harness: m[2] ?? 'OpenHands', score: Number(r[1]), setting: 'unlimited interaction rounds; official hidden tests', metrics};
    });
    const comparison = ts.find(t => t[0]?.[0] === 'Inputs' && t[0]?.includes('Overall'));
    const claude = rows.find(r => r.harness === 'Claude Code' && /Sonnet-4.5/i.test(r.model));
    if (claude) for (const r of comparison?.slice(2) ?? []) {
      if (r[0] !== 'Document + unittest') continue;
      rows.push({ ...claude, setting: 'document and unit tests provided', score: Number(r[7]),
        metrics: { easy: Number(r[1]), medium: Number(r[3]), hard: Number(r[5]), fullyPassedTasks: Number(r[8]),
          easyFullyPassed: Number(r[2]), mediumFullyPassed: Number(r[4]), hardFullyPassed: Number(r[6]) } });
    }
    return rows;
  },
};
export default board;
