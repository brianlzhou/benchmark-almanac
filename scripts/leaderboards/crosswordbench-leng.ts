// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// CrossWordBench scores crossword solving. Tables 2 and 9 report word correctness rates and standard errors.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.00043';
const puzzles = ['English 7x7', 'English 14x14', 'Chinese', 'English Simple', 'CommonSenseQA'];
const board: Leaderboard = {
  benchmark: 'crosswordbench-leng', feed, url: feed, static: 'paper',
  terms: 'The paper and its license are available at https://arxiv.org/abs/2504.00043.',
  headline: 'The headline averages word correctness across the five puzzle sets.',
  parts: { ...Object.fromEntries(puzzles.map(p => [p, p])), 'English 7x7 LCR':'English 7x7 letter completion rate', 'English 7x7 ICR':'English 7x7 intersection completion rate', 'English 14x14 LCR':'English 14x14 letter completion rate', 'English 14x14 ICR':'English 14x14 intersection completion rate', 'Chinese ICR':'Chinese intersection completion rate', 'English Simple ICR':'English Simple intersection completion rate', 'CommonSenseQA ICR':'CommonSenseQA intersection completion rate' },
  aliases: { 'GPT-4o-2024-11-20': 'gpt-4o-nov-2024', 'Pixtral-Large-Instruct-2411': 'pixtral-large',
    'DeepSeek-R1 (snapshot unspecified)': 'deepseek-r1', 'Gemini 2.0 Flash': 'gemini-2-0-flash-feb-2025' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<span [^>]*fa-lightbulb[^>]*>\s*<\/span>/g, ' [reasoning]');
    const tables = paperTables(html).map(grid);
    const results = new Map<string, LeaderboardRow>();
    for (const [header, measures, sets] of [
      ['7x7', ['WCR', 'LCR', 'ICR'], puzzles.slice(0, 2)],
      ['Chinese', ['WCR', 'ICR'], puzzles.slice(2)],
    ] as const) {
      const table = tables.find(t => t[0]?.[1] === header && t[1]?.slice(1).join('|') === sets.flatMap(() => measures).join('|')
        && t.some(r => /^Claude[ -]3/.test(r[0])));
      if (!table) throw new Error('Missing crossword table for ' + header);
      let mode = '';
      for (const [label, ...cells] of table.slice(2)) {
        if (/^(Proprietary|Open-Weight) L(V)?LMs$/.test(label)) {
          mode = label.includes('LVLM') ? 'Image' : 'Text';
          continue;
        }
        const reasoning = label.includes('[reasoning]');
        let model = label.replace(' [reasoning]', '').replace(/\s*†$/, '').replace(/^Claude 3\.7 sonnet$/, 'Claude-3-7-Sonnet');
        let setting = mode + ', zero-shot CoT';
        if (model === 'Claude-3-7-Sonnet') setting += reasoning ? ', thinking on' : ', thinking off';
        if (model === 'o3-mini-high') { model = 'o3-mini'; setting += ', high reasoning effort'; }
        const key = JSON.stringify([model, setting]);
        const row = results.get(key) ?? { model, setting, score: 0, metrics: {} };
        if (!mode || cells.length !== sets.length * measures.length) throw new Error('Unexpected crossword row');
        cells.forEach((cell, i) => {
          const match = /^(\d+\.\d+)\s*±\s*(\d+\.\d+)$/.exec(cell);
          if (!match) throw new Error('Invalid crossword result: ' + cell);
          const set = sets[Math.floor(i / measures.length)];
          const measure = measures[i % measures.length];
          const metric = measure === 'WCR' ? set : set + ' ' + measure;
          row.metrics![metric] = Number(match[1]) * 100;
          row.metrics![metric + ' stderr'] = Number(match[2]) * 100;
        });
        results.set(key, row);
      }
    }
    const rows = [...results.values()].filter(row => puzzles.every(p => p in row.metrics!));
    for (const row of rows) row.score = puzzles.reduce((sum, p) => sum + row.metrics![p], 0) / puzzles.length;
    return checked(rows, 10);
  },
};
export default board;
