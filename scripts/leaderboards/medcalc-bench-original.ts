// MedCalc-Bench tests medical calculations. Table 2 reports average accuracy on the original test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2406.12036";
const board: Leaderboard = {
  benchmark: "medcalc-bench-original", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2406.12036.',
  aliases: { 'Mistral 7B': 'mistral-7b-instruct-v0-2' },
  parts: { lab: 'Lab', physical: 'Physical', date: 'Date', dosage: 'Dosage', risk: 'Risk', severity: 'Severity', diagnosis: 'Diagnosis' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[1]?.join('|') === 'Model|Size|Lab|Phys.|Date|Dosage|Risk|Sev.|Diag.|Avg.');
    if (!t) throw new Error('Missing MedCalc-Bench Table 2');
    const keys = ['lab','physical','date','dosage','risk','severity','diagnosis','overall'];
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const [label, size, ...values] of t.slice(2)) {
      if (label === size && label.endsWith('Prompting')) { setting = label; continue; }
      if (!setting || values.length !== keys.length) throw new Error('Incomplete model or category row');
      const name = label.replace(/\s*\[.*?\]/g, '').trim();
      const model = size === 'N/A' ? name : name + ' ' + size;
      const metrics: Record<string, number> = {};
      let score = NaN;
      for (const [i, value] of values.entries()) {
        const [mean, std] = value.split(/\s+\\pm\s+/).map(numberCell);
        if (std === undefined) throw new Error('Missing reported standard deviation');
        if (keys[i] === 'overall') { score = mean; metrics.std = std; }
        else { metrics[keys[i]] = mean; metrics[keys[i]+'Std'] = std; }
      }
      rows.push({model, setting, score, metrics});
    }
    return checked(rows, 24);
  },
};
export default board;
