// RepoNormBench tests coding agents on functionality and repository rules.
// The Space lists functional success first and measures norm compliance independently.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/spaces/SYSUSELab/RepoNormBench-Leaderboard';
const feed = url + '/resolve/main/data/leaderboard.json';
type Scope = {task_macro: number, micro: number, coverage: number, included_tasks: number};
type Entry = {model_label: string, method_label: string, configuration_counts: Record<string, number>,
  functional_rate: number, functional_pass: number, joint_rate: number, joint_pass: number, tasks: number,
  scopes: Record<string, Scope>, functional_subset: Scope};
const board: Leaderboard = {
  benchmark: 'reponormbench', url, feed,
  terms: 'SYSUSELab publishes the leaderboard under the MIT license. ' + url + '/blob/main/LICENSE',
  headline: 'The board lists functional success first and reports norm compliance separately.',
  parts: {overall: 'Overall NCR', contribution: 'Contribution NCR', prompt_omitted: 'Prompt-omitted NCR', joint: 'Functional + all norms'},
  async fetch() {
    const data = await fetchJson<{entries: Entry[], configurations: Record<string, {agent: string}>}>(feed);
    const rows = data.entries.map(entry => {
      const agents = new Set(Object.keys(entry.configuration_counts).map(id => data.configurations[id].agent));
      if (agents.size !== 1) throw new Error('Inconsistent harness');
      const metrics: Record<string, number> = {functionalPass: entry.functional_pass, joint: 100 * entry.joint_rate, jointPass: entry.joint_pass,
        tasks: entry.tasks, functionalSubsetMicro: 100 * entry.functional_subset.micro};
      for (const name of ['overall', 'contribution', 'prompt_omitted']) {
        const scope = entry.scopes[name];
        metrics[name] = 100 * scope.task_macro;
        metrics[name + 'Micro'] = 100 * scope.micro;
        metrics[name + 'Coverage'] = 100 * scope.coverage;
        metrics[name + 'Tasks'] = scope.included_tasks;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing RepoNormBench measurement');
      return {model: entry.model_label, setting: entry.method_label, harness: [...agents][0], score: entry.functional_rate * 100, metrics};
    });
    return checked(rows, 9);
  },
};
export default board;
