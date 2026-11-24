// Asper-Bench measures whether a program completes the user's task. Tables 3 and 18
// report five-shot success by checkpoint. Table 4 adds one-shot settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2507.15501';
const board: Leaderboard = {
  benchmark: 'asper-bench', feed, url: feed, static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2507.15501.',
  aliases: {
    'gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash-may-2025',
    'gpt-4o-2024-05-13': 'gpt-4o-may-2024', 'gpt-4o-2024-11-20': 'gpt-4o-nov-2024',
    'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024', 'gpt-4o-mini-2024-07-18': 'gpt-4o-mini',
    'gemini-1.5-flash-002': 'gemini-1-5-flash-sep-2024', 'gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024',
    'gemini-1.0-pro-002': 'gemini-1-0-pro', 'gemini-2.0-flash-001': 'gemini-2-0-flash-feb-2025',
    'Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
    'o1-preview-2024-09-12': 'o1-preview', 'o1-mini-2024-09-12': 'o1-mini',
    'o3-2025-04-16': 'o3', 'o3-mini-2025-01-31': 'o3-mini',
  },
  stats: {
    syntaxError: {name: 'Syntax error rate', unit: '%', better: 'lower'},
    asperaImports: {name: 'Task success allowing ASPERA imports', unit: '%', better: 'higher'},
    futureImports: {name: 'Task success allowing future imports', unit: '%', better: 'higher'},
    solutionError: {name: 'Solution error rate', unit: '%'}, executionError: {name: 'Execution error rate', unit: '%'},
    handbackError: {name: 'Handback control error rate', unit: '%'},
    microF1: {name: 'Primitive selection micro F1', unit: 'score'},
    precision: {name: 'Primitive selection precision', unit: 'score'}, recall: {name: 'Primitive selection recall', unit: 'score'},
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0].join('|') === 'Model name|Checkpoint|Size|Task success (%)|Syntax err. (%)');
    const extra = tables.find(t => t[0].includes('Handback control err. rate') && t[1].includes('Future Imports'));
    const settings = tables.find(t => t[0].join('|') === 'Model name|Setting|# ICE|Micro F1|P|R|Task success (%)');
    if (!main || !extra || !settings) throw new Error('Missing Asper-Bench results columns');
    const fiveShot = new Map<string, LeaderboardRow>();
    for (const [, model, size, success, syntax] of main.slice(1)) {
      fiveShot.set(model, { model, setting: 'CCK, 5-shot', score: numberCell(success),
        ...(size === '-' ? { trials: 3 } : { params: numberCell(size.replace(/B$/, '')) }),
        metrics: syntax === '-' ? {} : { syntaxError: numberCell(syntax) } });
    }
    for (const [, model, success, ...values] of extra.slice(2)) {
      const row = fiveShot.get(model) ?? { model, setting: 'CCK, 5-shot', score: numberCell(success), metrics: {} };
      if (row.score !== numberCell(success)) throw new Error('Repeated success rates disagree');
      const keys = ['asperaImports', 'futureImports', 'solutionError', 'executionError', 'handbackError'];
      values.forEach((value, i) => { if (value !== '—') row.metrics![keys[i]] = numberCell(value); });
      fiveShot.set(model, row);
    }
    const rows = [...fiveShot.values()];
    for (const [name, setting, shots, f1, precision, recall, success] of settings.slice(1)) {
      if (shots === '5') continue;
      const model = main.find(row => row[0] === name)?.[1];
      if (!model) throw new Error('Unknown model in Table 4');
      rows.push({ model, setting: setting + ', ' + shots + '-shot', score: numberCell(success),
        metrics: f1 === '-' ? {} : { microF1: numberCell(f1), precision: numberCell(precision), recall: numberCell(recall) } });
    }
    return checked(rows, 21);
  },
};
export default board;
