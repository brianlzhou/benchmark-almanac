// VideoGen-RewardBench compares video preference predictions with human judgments.
// Read the Space's evals files and reproduce its Avg. column, including both rounds of rounding.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/KlingTeam/VideoGen-RewardBench";
const feed = "https://huggingface.co/api/spaces/KlingTeam/VideoGen-RewardBench/tree/main/evals";
const modes = [['with_tie','w/ Ties'], ['without_tie','w/o Ties']] as const;
const labels = { overall: 'Overall', vq: 'VQ', mq: 'MQ', ta: 'TA' };
type Result = Record<typeof modes[number][0], Record<string, number>> & {model: string, model_link: string};
// An exact binary tie at two decimal places is an odd multiple of one eighth.
// Python rounds such ties to the even hundredth.
function round2(value: number) {
  if (Number.isInteger(value * 8) && !Number.isInteger(value * 100)) return 2 * Math.round(value * 50) / 100;
  return Number(value.toFixed(2));
}
const board: Leaderboard = {
 stats: { with_tie: { name: 'Overall preference with ties', unit: '%', better: 'higher' }, without_tie: { name: 'Overall preference without ties', unit: '%', better: 'higher' } },
  benchmark: 'videogen-rewardbench', url, feed,
  terms: "The Hugging Face Space declares the MIT License. Hugging Face allows these paths in robots.txt.",
  parts: Object.fromEntries(Object.entries(labels).flatMap(([key,name]) =>
    modes.map(([mode,label]) => [mode + '_' + key, {name: name + ' (' + label + ')', group: label}]))),
  async fetch() {
    const files = (await fetchJson<{type: string, path: string}[]>(feed)).filter(f => f.type === 'file' && f.path.endsWith('.json'));
    if (files.length < 5) throw new Error('Missing VideoGen-RewardBench evaluation files');
    const rows = [];
    for (const f of files) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const r = await fetchJson<Result>(url + '/resolve/main/' + f.path);
      if (!r.model) throw new Error('Missing model in ' + f.path);
      const metrics: Record<string, number> = {};
      for (const [mode] of modes) {
        const values = Object.values(r[mode]);
        if (values.length !== 4) throw new Error('Expected four preference dimensions');
        for (const key of Object.keys(labels)) {
          if (!Number.isFinite(r[mode][key])) throw new Error('Missing ' + key + ' in ' + f.path);
          metrics[mode + '_' + key] = r[mode][key];
        }
        metrics[mode] = round2(values.reduce((sum,v) => sum + v, 0) / values.length);
      }
      rows.push({ model: r.model, score: round2((metrics.with_tie + metrics.without_tie) / 2),
        link: r.model_link || undefined, metrics });
    }
    return rows;
  },
};
export default board;
