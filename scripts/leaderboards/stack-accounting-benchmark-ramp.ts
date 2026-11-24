// Ramp compares accounting agents by mean criteria accuracy across eight simulated businesses.
// The charts distinguish pass@1, pass@5 and pass^5.
// The post's charts publish confidence intervals, task category accuracy, pass rates and runtime.
import type { Leaderboard } from './types.ts';
import { rampArray, rampBundle } from './accounting-autocoding-ramp.ts';
const feed = "https://builders.ramp.com/post/stack-benchmarking";
const board: Leaderboard = {
  benchmark: 'stack-accounting-benchmark-ramp',
  url: "https://builders.ramp.com/post/stack-benchmarking",
  feed,
  terms: "Ramp's robots.txt permits the site. The engineering post gives no separate data reuse license.",
  stats: { passAt1: { name: 'Pass at 1', unit: '%', better: 'higher' }, passAt5: { name: 'Pass at 5', unit: '%', better: 'higher' }, pass5: { name: 'Pass to the fifth power', unit: '%', better: 'higher' } },
  aliases: { 'Opus 4.7': 'claude-opus-4-7', 'Opus 4.6': 'claude-opus-4-6' },
  chart: { title: 'Accuracy versus runtime', x: {key: 'latency', label: 'Runtime per task', unit: 's', better: 'lower'},
    y: {key: 'score', label: 'Mean criteria accuracy', unit: '%', better: 'higher'} },
  async fetch() {
    const bundle = await rampBundle(feed);
    const main = rampArray<Record<string, number> & {name: string}>(bundle, 'accuracy_lo', 7);
    const categoryBlock = bundle.match(/(\[\{name:"Ramp Stack",color:"[^"]+"\}(?:,\{name:"[^"]+",color:"[^"]+"\})+\]),\w+=(\[\{label:"Variance Analysis",values:\[[\d.,]+\]\}(?:,\{label:"[^"]+",values:\[[\d.,]+\]\})+\])/);
    if (!categoryBlock) throw new Error('Missing Ramp category chart');
    const names = [...categoryBlock[1].matchAll(/name:"([^"]+)"/g)].map(m => m[1]);
    const categories = [...categoryBlock[2].matchAll(/label:"([^"]+)",values:(\[[\d.,]+\])/g)].map(m => ({
      name: m[1], values: JSON.parse(m[2]) as number[] }));
    if (categories.length < 4 || categories.some(c => c.values.length !== names.length)) throw new Error('Incomplete categories');
    board.parts = Object.fromEntries(categories.map(c => [c.name, c.name]));
    const runtimes = new Map([...bundle.matchAll(/\{name:"([^"]+)",accuracy:([\d.]+),latencyS:([\d.]+),/g)].map(m => [m[1], [Number(m[2]), Number(m[3])]]));
    return main.map(r => {
      const index = names.indexOf(r.name), runtime = runtimes.get(r.name);
      if (index < 0 || runtime?.[0] !== r.accuracy) throw new Error('Inconsistent Ramp charts');
      const metrics: Record<string, number> = {};
      for (const [source, key] of [['pass1', 'passAt1'], ['pass5', 'passAt5'], ['powPass5', 'pass5']]) {
        metrics[key] = r[source];
        metrics[key + 'Low'] = r[source + '_lo'];
        metrics[key + 'High'] = r[source + '_hi'];
      }
      if (![r.accuracy, r.accuracy_lo, r.accuracy_hi, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Missing Ramp metrics');
      for (const c of categories) metrics[c.name] = c.values[index];
      metrics.latency = runtime[1];
      return { model: r.name, score: r.accuracy, low: r.accuracy_lo, high: r.accuracy_hi, trials: 5, metrics,
        setting: r.name === 'Ramp Stack' ? 'Skills and memory' : 'No skills or memory' };
    });
  },
};
export default board;
