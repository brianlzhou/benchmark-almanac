// PerspectiveGap tests whether a model gives each agent the information its role requires.
// The official leaderboard's combined pass rate covers role assignment and prompt writing.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/sun1245/PerspectiveGap-Leaderboard';
const data = url + '/raw/main/data/';
const feed = data + 'model_leaderboard.csv';
const topologies = {cr: 'coder reviewer', crp: 'coder reviewer pool', dcr: 'dispatcher coder reviewer',
  dcrp: 'dispatcher coder reviewer pool', pl: 'dispatcher planloop codeloop', plp: 'dispatcher planloop codeloop pool',
  scr: 'dispatcher scientist coder reviewer', tl: 'dispatcher theoryloop codeloop', tlp: 'dispatcher theoryloop codeloop pool',
  spl: 'supervisor phdstudent librarian'};
function readNumber(row: Record<string, string>, key: string) {
  if (!/^\d+(?:\.\d+)?$/.test(row[key] ?? '')) throw new Error('Invalid ' + key + ' for ' + row.model);
  return Number(row[key]);
}
const board: Leaderboard = {
  benchmark: 'perspectivegap', url, feed, terms: 'The authors license the Space under MIT. ' + url + '/blob/main/README.md',
  parts: {role_assignment_pct: 'Role-fragment assignment', prompt_writing_pct: 'Prompt writing',
    ...Object.fromEntries(Object.entries(topologies).map(([key, name]) => [key, {name, group: 'Topology'}]))},
  stats: {
    combined_pass: { name: 'Combined passed cases', unit: 'count' },
    role_assignment_pass: { name: 'Role-assignment passed cases', unit: 'count' },
    prompt_writing_pass: { name: 'Prompt-writing passed cases', unit: 'count' },
  },
  async fetch() {
    const all = parseCsv(await fetchText(feed));
    const topology = parseCsv(await fetchText(data + 'topology_combined_top12.csv'));
    if (topology.length < 12) throw new Error('Missing topology results');
    const groups = new Map(topology.map(r => [r.model, Object.fromEntries(Object.keys(topologies).map(key => [key, readNumber(r, key)]))]));
    return checked(all.map(r => {
      const keys = ['combined_pass', 'role_assignment_pct', 'role_assignment_pass',
        'prompt_writing_pct', 'prompt_writing_pass'];
      const metrics = {...Object.fromEntries(keys.map(key => [key, readNumber(r, key)])), ...groups.get(r.model)};
      return {model: r.model, score: readNumber(r, 'combined_pct'), metrics};
    }), 35);
  },
};
export default board;
