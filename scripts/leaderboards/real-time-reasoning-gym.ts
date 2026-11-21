// Real-Time Reasoning Gym tests agents under time pressure in three games.
// Figure 1 explains that "Scores are averaged across different games."
// Tables 6 to 8 supply normalized rewards for each game in the token-budget experiments.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2511.04898';
const games = ['Freeway', 'Snake', 'Overcooked'];
const board: Leaderboard = {
  benchmark: 'real-time-reasoning-gym', url: feed, feed, static: 'paper',
  terms: 'The authors publish their results under the license linked at https://arxiv.org/abs/2511.04898.',
  parts: Object.fromEntries(games.map(game => [game, game])),
  headline: 'The headline averages normalized reward across Freeway, Snake, and Overcooked.',
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const table of [6, 7, 8]) {
      const figure = html.split('<figure id="A3.T' + table + '"')[1]?.split('</figure>')[0];
      if (!figure) throw new Error('Missing results table ' + table);
      const panels = figure.split(/<div class="ltx_flex_cell\b/).slice(1);
      const byGame = games.map(game => {
        const label = panels.findIndex(p => p.includes('>' + game + '<'));
        const panel = label < 0 ? undefined : panels[label + 1];
        if (!panel) throw new Error('Missing game ' + game);
        return grid(paperTables(panel)[0]);
      });
      const methods = table === 8 ? ['Reactive (thinking off)', 'Planning (thinking on)', 'AgileThinker']
        : ['Code-as-Policy', 'Reactive (R1)', 'Reactive (V3)', 'Planning (R1)', 'AgileThinker'];
      const header = [table === 6 ? 'Cognitive Load' : 'Tokens/Turn', ...methods].join('|');
      if (byGame.some(g => g[0].join('|') !== header)) throw new Error('Game columns changed');
      for (const level of table === 6 ? ['Easy', 'Medium', 'Hard'] : ['4k', '8k', '16k', '32k']) {
        const setting = table === 6 ? level + ', 8k tokens per step (load sweep)'
          : (table === 7 ? 'Medium' : 'Hard') + ', ' + level + ' tokens per step (budget sweep)';
        methods.forEach((harness, index) => {
          const metrics = Object.fromEntries(byGame.map((g, j) => {
            const row = g.find(r => r[0] === level);
            if (!row) throw new Error('Missing setting ' + level);
            return [games[j], numberCell(row[index + 1])];
          }));
          const blend = table !== 8 && harness === 'AgileThinker';
          const model = table === 8 ? 'DeepSeek-V3.2' : blend || harness === 'Reactive (V3)' ? 'DeepSeek-V3' : 'DeepSeek-R1';
          rows.push({ model, harness, setting, metrics, score: Object.values(metrics).reduce((a, b) => a+b) / games.length,
            ...(blend ? {models: ['DeepSeek-V3', 'DeepSeek-R1']} : {}) });
        });
      }
    }
    return checked(rows, 47);
  },
};
export default board;
