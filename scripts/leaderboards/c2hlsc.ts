// The source reports no overall score. The headline is the plain mean of the 10 parts, computed by this importer.
// C2HLSC tests synthesis-ready C rewrites. Each parsed.csv reports successful runs out of ten for each program.
// The adaptive configuration starts with GPT-4o mini and escalates to GPT-4o.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const root = 'https://raw.githubusercontent.com/Lucaz97/c2hlsc/HEAD/results/';
const tasks = ['Cipher','sha256_update','Runs','quickSort','present80_encryptBlock','Overlapping','Frequency','des_crypt','CumulativeSums','BlockFrequency'];
const board: Leaderboard = {
  benchmark: 'c2hlsc', url: 'https://github.com/Lucaz97/c2hlsc/tree/main/results', feed: root+'res_area/parsed.csv',
  terms: 'The authors publish the results under their repository license. https://github.com/Lucaz97/c2hlsc/blob/main/LICENSE',
  headline: 'The repository reports each program separately, so this is the mean success rate across ten programs.',
  parts: Object.fromEntries(tasks.map(name => [name, name])),
  stats: {
    inputTokensPerSuccess: { name: 'Input tokens per successful program', unit: 'tokens', better: 'lower' },
    outputTokensPerSuccess: { name: 'Output tokens per successful program', unit: 'tokens', better: 'lower' },
    costPerSuccess: { name: 'Cost per successful program', unit: 'usd', better: 'lower' },
  },
  aliases: { 'GPT-4o mini (snapshot unspecified)': 'gpt-4o-mini', 'GPT-4o mini': 'gpt-4o-mini', 'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet' },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [target, directory] of [['Area','res_area'],['Latency','res_lat']]) {
      const table = parseCsv(await fetchText(root + directory + '/parsed.csv'));
      if (table.length !== tasks.length || !tasks.every(t => table.some(r => r.name === t))) throw new Error('Changed program list');
      for (const config of ['claude','adaptive']) {
        const metrics: Record<string,number> = {};
        let successes = 0, input = 0, output = 0, cost = 0;
        for (const row of table) {
          const value = row[config + '_success'];
          if (!/^(?:10|[0-9])$/.test(value)) throw new Error('Missing success count for ' + row.name);
          const count = Number(value);
          metrics[row.name] = 10 * count;
          successes += count;
          if (count === 0) continue;
          const models = config === 'claude' ? ['claude'] : ['mini','4o'];
          for (const name of models) {
            input += count * Number(row['input_tokens_'+name]);
            output += count * Number(row['output_tokens_'+name]);
          }
          cost += count * Number(row[config+'_cost']);
        }
        if (successes > 0) Object.assign(metrics, {inputTokensPerSuccess: input/successes, outputTokensPerSuccess: output/successes, costPerSuccess: cost/successes});
        const adaptive = config === 'adaptive';
        rows.push({model: adaptive ? 'GPT-4o mini' : 'claude-3-5-sonnet-20240620', setting: target + ' target',
          ...(adaptive ? {models: ['GPT-4o mini', 'GPT-4o (snapshot unspecified)'], harness: 'C2HLSC adaptive'} : {harness: 'C2HLSC'}),
          score: successes * 100 / (tasks.length * 10), trials: 10, metrics});
      }
    }
    return checked(rows, 4);
  },
};
export default board;
