// Extract Bench scores structured extraction from PDFs. Tables 5 and 8 report overall field pass rate
// with invalid documents contributing zero. Express the printed percentages as scores from 0 to 1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.12247';
const domains = ['Credit','Research','Resumes','Sports','SEC 10-K/Q'];
const percent = (cell:string) => numberCell(cell.replace(/%$/, '')) / 100;
const board: Leaderboard = {
  stats: {
    validDocuments: { name: 'Valid documents', unit: 'count', better: 'higher' },
    validAccuracy: { name: 'Valid document accuracy', unit: 'score', better: 'higher' },
    'Overall fields passed': { name: 'Overall fields passed', unit: 'count', better: 'higher' },
    'Empty response': { name: 'Empty response failures', unit: 'count', better: 'lower' },
    'Trailing comma': { name: 'Trailing comma failures', unit: 'count', better: 'lower' },
    'PDF page limit': { name: 'PDF page limit failures', unit: 'count', better: 'lower' },
    'Truncated JSON': { name: 'Truncated JSON failures', unit: 'count', better: 'lower' },
    'Context length': { name: 'Context length failures', unit: 'count', better: 'lower' },
    'Total failures': { name: 'Total failures', unit: 'count', better: 'lower' },
  },
  benchmark: 'extract-bench-contextual', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2602.12247",
  parts: Object.fromEntries(domains.map(d => [d, d])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const base = tables.find(t => t[1]?.join('|') === ['Model','Valid',...domains,'Overall','Acc'].join('|'));
    const structured = tables.find(t => t[0]?.join('|') === 'Model|Credit|Research|Sports|Overall');
    const errors = tables.find(t => t[0]?.[0] === 'Error Type');
    if (!base || !structured || !errors) throw new Error('Missing Extract Bench table');
    const rows: LeaderboardRow[] = [];
    const errorNames:Record<string,string> = {'G3 Flash':'Gemini 3 Flash','G3 Pro':'Gemini 3 Pro','Opus':'Claude Opus 4.5','Sonnet':'Claude Sonnet 4.5'};
    for (const [label,valid,...cells] of base.slice(3)) {
      if (label === 'Aggregate') continue;
      const model = /^(Sonnet|Opus)/.test(label) ? 'Claude '+label : label;
      const [validDocuments,trials] = valid.split('/').map(numberCell);
      const metrics: Record<string,number> = {validDocuments, validAccuracy:percent(cells[6])};
      let score = NaN;
      for (const [i, key] of [...domains,'Overall'].entries()) {
        const match = cells[i].match(/^(\d+)\/(\d+) \(([\d.]+%)\)$/);
        if (!match) throw new Error('Missing field counts');
        if (key === 'Overall') {
          score = percent(match[3]);
          metrics['Overall fields passed'] = numberCell(match[1]);
        } else {
          metrics[key] = percent(match[3]);
        }
      }
      const j = errors[0].findIndex(k => (errorNames[k] || k) === model);
      if (j < 1) throw new Error('Missing failure counts');
      for (const r of errors.slice(1)) metrics[r[0]] = r[j] === '—' ? 0 : numberCell(r[j]);
      rows.push({model,setting:'Baseline',trials,score,metrics});
    }
    for (const [model,credit,research,sports,overall] of structured.slice(1)) {
      if (model === 'Total') continue;
      rows.push({model,setting:'Structured outputs',trials:35,score:percent(overall),
        metrics:{Credit:percent(credit),Research:percent(research),Sports:percent(sports),Resumes:0,'SEC 10-K/Q':0}});
    }
    return checked(rows,12);
  },
};
export default board;
