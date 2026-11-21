// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// ATOM-Bench tests robot policies on motor skills, instructions and held-out compositions on two robots.
// Both tables in Results give success rates as percentages. Process success and transfer measures stay beside each rate.
import type { BoardPart, Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://flageval-baai.github.io/AtomBenchPage/';
const platforms = ['Franka Panda', 'Cobot Magic'];
const parts: Record<string, BoardPart> = {};
const groups = [
  { columns: ['Motor SR', 'Motor PSR', 'Instr. SR', 'Instr. PSR'], keys: ['motor', 'motorPsr', 'instruction', 'instructionPsr'] },
  { columns: ['SR', 'PSR', 'AS', 'CFS'], keys: ['composition', 'compositionPsr', 'atomicScore', 'compositionalFailureShare'] },
];
for (const robot of ['Franka Panda', 'Cobot Magic']) {
  const prefix = robot === 'Franka Panda' ? 'franka_' : 'cobot_';
  parts[prefix + 'motor'] = {name: robot + ': Motor Set', group: robot, unit:'%'};
  parts[prefix + 'instruction'] = {name: robot + ': Instruction Set', group: robot, unit:'%'};
  parts[prefix + 'composition'] = {name: robot + ': Composition Set', group: robot, unit:'%'};
}
const stats: Record<string, {name:string, unit:string, better:'higher'|'lower'}> = {};
for (const robot of ['Franka Panda', 'Cobot Magic']) {
  const prefix = robot === 'Franka Panda' ? 'franka_' : 'cobot_';
  stats[prefix + 'motorPsr'] = {name: robot + ': Motor process success rate', unit:'%', better:'higher'};
  stats[prefix + 'instructionPsr'] = {name: robot + ': Instruction process success rate', unit:'%', better:'higher'};
  stats[prefix + 'compositionPsr'] = {name: robot + ': Composition process success rate', unit:'%', better:'higher'};
  stats[prefix + 'atomicScore'] = {name: robot + ': Atomic success score', unit:'%', better:'higher'};
  stats[prefix + 'compositionalFailureShare'] = {name: robot + ': Compositional failure share', unit:'%', better:'lower'};
}
const board: Leaderboard = {
  benchmark: 'atom-bench', url: feed + '#results', feed, parts, stats,
  terms: 'BAAI FlagEval publishes these results at https://flageval-baai.github.io/AtomBenchPage/. The authors retain their rights.',
  aliases: { 'Pi0.5': 'pi0-5', 'GROOT N1.6': 'gr00t-n1-6' },
  async fetch() {
    const data = tables(await fetchText(feed)).map(table => table.map(row => row.map(cell => cell.text)));
    const byModel = new Map<string,Record<string,number>>();
    for (const {columns, keys} of groups) {
      const header = ['Model', ...columns, ...columns].join('|');
      const table = data.find(t => t[0]?.slice(1).join('|') === platforms.join('|') && t[1]?.join('|') === header);
      if (!table) throw new Error('Missing results table: ' + header);
      for (const [model,...values] of table.slice(2)) {
        if (values.length !== 8 || values.some(x => !/^\d+(?:\.\d+)?$/.test(x))) throw new Error('Invalid result for ' + model);
        const metrics = byModel.get(model) ?? {};
        values.forEach((v, i) => {
          const robot = platforms[Math.floor(i/4)];
          const task = keys[i%4];
          const key = (i < 4 ? 'franka_' : 'cobot_') + task;
          metrics[key] = Number(v);
          const name = {motor:'Motor Set',instruction:'Instruction Set',composition:'Composition Set'}[task];
          if (name) parts[key] = {name: robot + ': ' + name, group: robot, unit:'%'};
        });
        byModel.set(model, metrics);
      }
    }
    const rows = [...byModel].filter(([,m]) => Object.keys(parts).every(key => key in m)).map(([model, metrics]) => ({
      model, metrics, score: Object.keys(parts).reduce((sum,key)=>sum+metrics[key],0)/6,
    }));
    return checked(rows,5);
  },
};
export default board;
