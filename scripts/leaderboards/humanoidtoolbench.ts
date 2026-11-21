// The source reports no overall score. The headline is the plain mean of the 18 parts, computed by this importer.
// HumanoidToolBench tests tool use in simulation. The authors publish success rates in standard and decoy modes.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://snu-pi.github.io/HumanoidToolBench/';
const board: Leaderboard = {
  benchmark: 'humanoidtoolbench', url: feed + '#results', feed,
  terms: 'The authors publish these results on their project page at https://snu-pi.github.io/HumanoidToolBench/.',
  headline: 'The headline is mean success across 18 simulation tasks, with 100 episodes per task.',
  aliases: { 'π 0.5': 'pi0-5' },
  async fetch() {
    const html = await fetchText(feed);
    const models = new Map<string, Record<string, number>>();
    const parts: Record<string, string> = {};
    for (const mode of ['standard', 'decoy']) {
      const section = html.split('aria-label="Simulation success rate in percent, ' + mode + ' mode">')[1]?.split('</table>')[0];
      if (!section) throw new Error('Missing simulation success table for ' + mode);
      const table = grid(tables('<table>' + section + '</table>')[0]);
      const columns = table[1].map((scenario, i) => {
        if (!scenario || i === 0) return '';
        const name = mode + ', ' + table[0][i] + ', ' + scenario;
        parts[name] = name;
        return name;
      });
      if (columns.filter(Boolean).length !== 9) throw new Error('Missing task columns');
      for (const row of table.slice(2)) {
        const model = row[0].replace(/ (IL|VLA|WAM)$/, '').replace(/^Ψ 0$/, 'Ψ0 (Psi Zero)');
        const metrics = models.get(model) ?? {};
        columns.forEach((name, i) => { if (name) metrics[name] = numberCell(row[i]); });
        models.set(model, metrics);
      }
    }
    board.parts = parts;
    const policyTable = tables(html).map(grid).find(t => t[0]?.join('|') === 'Policy|Family|Parameters|Action chunk|Real robot');
    if (!policyTable) throw new Error('Missing policy parameter table');
    const params = new Map<string, number>();
    for (const row of policyTable.slice(1)) {
      const value = row[2]?.match(/^(\d+(?:\.\d+)?)([MB])$/i);
      if (!value) throw new Error('Invalid policy parameter count');
      const count = Number(value[1]) * (value[2].toUpperCase() === 'M' ? 0.001 : 1);
      const model = row[0] === 'π 0.5' ? 'pi0-5' : row[0] === 'Ψ 0' ? 'Ψ0 (Psi Zero)' : row[0] === 'GR00T N1.7' ? 'gr00t-n1-7' : row[0] === 'Cosmos 3 Edge Policy' ? 'cosmos3-edge' : row[0];
      params.set(model, count);
    }
    const rows = [...models].map(([model, metrics]) => {
      const values = Object.values(metrics);
      if (values.length !== 18) throw new Error('Incomplete policy: ' + model);
      return { model, score: values.reduce((sum, x) => sum + x, 0) / 18, metrics, params: params.get(model), trials: 1800 };
    });
    return checked(rows, 7);
  },
};
export default board;
