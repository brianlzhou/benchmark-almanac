// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// ProjectTest evaluates unit tests for real projects. Tables 2 to 4 give correctness rates for Python, Java and JavaScript.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';
const feed = 'https://arxiv.org/html/2502.06556';
const languages = ['Python', 'Java', 'JavaScript'];
const keys = ['CR', 'ER', 'LC', 'BC', '#Tests', '#Correct'];
const board: Leaderboard = {
  benchmark: 'projecttest', url: feed, feed, static: 'paper',
  terms: 'The paper and its license are available at https://arxiv.org/abs/2502.06556.',
  headline: 'The paper reports no overall score, so this is the plain mean of correctness rates for Python, Java and JavaScript.',
  // Table 2's caption defines the columns: ER is the executability rate, LC and BC are line and branch coverage,
  // #Tests is the average number of tests per project
  stats: Object.fromEntries(
    languages.flatMap((language) =>
      Object.entries({
        ER: { name: 'executability rate', unit: '%', better: 'higher' as const, note: 'The share of generated unit tests that run.' },
        LC: { name: 'line coverage', unit: '%', better: 'higher' as const },
        BC: { name: 'branch coverage', unit: '%', better: 'higher' as const },
        '#Tests': { name: 'tests per project', unit: 'count', note: 'The average number of unit tests generated for each project.' },
        '#Correct': { name: 'correct tests per project', unit: 'count', note: 'The average number of generated unit tests that pass, for each project.' },
      }).map(([key, s]) => [`${language} ${key}`, { ...s, name: `${language} ${s.name}` }]),
    ),
  ),
  aliases: {'CodeQwen1.5': 'codeqwen1-5-7b', 'DeepSeek-Coder': 'deepseek-coder-6-7b', 'GPT-o1': 'o1', 'Gemini-3.0-Pro': 'gemini-3-pro'},
  parts: Object.fromEntries(languages.map(language => [language + ' CR', language])),
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [i, setting] of ['Vanilla', 'Manual fixing', 'Self-fixing'].entries()) {
      const figure = html.split('id="S5.T' + (i + 2) + '"')[1]?.split('</figure>')[0];
      const table = figure && paperTables(figure).map(grid).find(t => t[0].join('|') === ['Model', ...keys].join('|'));
      if (!table) throw new Error('Missing ProjectTest results for ' + setting);
      let language = '';
      const models = new Map<string, Record<string, number>>();
      for (const [model, ...cells] of table.slice(1)) {
        if (new Set([model, ...cells]).size === 1) { language = model; continue; }
        if (!languages.includes(language) || cells.length !== keys.length) throw new Error('Invalid row for ' + model);
        const metrics = models.get(model) ?? {};
        cells.forEach((value, j) => { metrics[language + ' ' + keys[j]] = numberCell(value.split(' (')[0]); });
        models.set(model, metrics);
      }
      for (const [model, metrics] of models) {
        const score = languages.reduce((sum, l) => sum + metrics[l + ' CR'], 0) / languages.length;
        rows.push({model, setting, score, metrics});
      }
    }
    return checked(rows, 33);
  },
};
export default board;
