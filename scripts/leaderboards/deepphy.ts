// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// DeepPHY measures physical reasoning in six simulators. Tables 6, 10, 14, 16, 18 and 19 give VLA success rates.
// Use the last reported attempt for each simulator and retain both Kinetix visual annotation conditions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2508.05405';
const environments = ['PHYRE', 'I-PHYRE', 'Kinetix', 'Pooltool', 'Angry Birds', 'Cut the Rope'];
const board: Leaderboard = {
  benchmark: 'deepphy', url: feed, feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The headline averages success rates across the six environments at their published attempt limits.',
  parts: Object.fromEntries(environments.map(name => [name, name])),
  aliases: { 'GPT-4-Vision-Preview':'gpt-4v','GPT-o3-0416':'o3','GPT-o4-mini-0416':'o4-mini',
    'GPT-4o-0806':'gpt-4o-aug-2024','GPT-4o-mini-0718':'gpt-4o-mini','Claude 4.0 Opus':'claude-opus-4',
    'Claude 4.0 Sonnet':'claude-sonnet-4','Gemini-2.5-Pro-06-17':'gemini-2-5-pro-jun-2025','Gemini-2.5-Flash-06-17':'gemini-2-5-flash-jun-2025' },
  async fetch() {
    const html = await paperHtml(feed);
    const figures = Array.from(html.matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/g), m => m[0]);
    function read(number: number, title: string, column: string) {
      const figure = figures[number - 1];
      if (!figure?.includes(title)) throw Error('Missing ' + title);
      const table = paperTables(figure).map(grid)[0];
      if (!table || !table.slice(0, 2).some(row => row.includes(column))) throw Error('Missing ' + column);
      return table;
    }
    const names = read(4, 'Abbreviations', 'Abbreviation');
    const inputs = [read(6,'PHYRE','Att. 10'), read(10,'I-PHYRE','Att. 10'), read(14,'Kinetix','w/ anno'),
      read(16,'Pooltool','Att. 15'), read(18,'Angry Birds','SuccRate'), read(19,'Cut the Rope','SuccRate')];
    const rows: LeaderboardRow[] = [];
    for (const [model, abbreviation] of names.slice(1)) {
      if (/Models$|Series$/.test(model)) continue;
      for (const annotation of [1,2]) {
        const columns = [10,10,annotation,6,1,1];
        const metrics: Record<string,number> = {};
        for (const [i, table] of inputs.entries()) {
          const row = table.find(row => row[0] === abbreviation);
          const raw = row?.[columns[i]];
          const value = raw?.replace(/\s*✗$/, '');
          if (i === 3) metrics.pooltoolFixedOutput = raw?.includes('✗') ? 1 : 0;
          if (!value || !/^\d+(\.\d+)?%$/.test(value)) throw Error('Missing ' + environments[i] + ' for ' + model);
          metrics[environments[i]] = parseFloat(value);
          if (i === 0 || i === 1 || i === 3) metrics[environments[i] + ' Average Attempts'] = parseFloat(row!.at(-1)!);
          if (i === 4 || i === 5) metrics[environments[i] + ' Total Stars'] = Number(row![2]);
        }
        const score = environments.reduce((sum, name) => sum + metrics[name], 0) / environments.length;
        rows.push({ model, score, trials: 3, metrics, setting: annotation === 1 ? 'VLA without Kinetix annotations' : 'VLA with Kinetix annotations' });
      }
    }
    return checked(rows, 32);
  },
};
export default board;
