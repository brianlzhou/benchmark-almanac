// Overall accuracy across all 226 questions. Diagnostic controls remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';
const url = 'https://ranranrannervous.github.io/EarthRecord/';
const feed = `${url}static/js/leaderboard-data.js`;
interface Entry { name: string; overall: number; interval: number[]; tasks: number[]; computable: number[]; recognition: number[]; pairs: number[]; placebo: number[] }
export default {
  benchmark: 'earthrecord', parts: {
  Quantify: { name: 'Quantify', group: 'Task type' },
  Date: { name: 'Date', group: 'Task type' },
  'Anomaly and climate': { name: 'Anomaly and climate', group: 'Task type' },
  Detect: { name: 'Detect', group: 'Task type' },
  Trend: { name: 'Trend', group: 'Task type' },
  Recovery: { name: 'Recovery', group: 'Task type' },
  Season: { name: 'Season', group: 'Task type' },
  Compare: { name: 'Compare', group: 'Task type' },
  Attribute: { name: 'Attribute', group: 'Task type' },
  'Regional statistics': { name: 'Regional statistics', group: 'Task type' },
  computable_1: { name: 'Computable', group: 'Category' },
  recognition_1: { name: 'Recognition', group: 'Category' },
  computable_0: { name: 'Computable closed-book', group: 'Control' },
  recognition_0: { name: 'Recognition closed-book', group: 'Control' },
  pairs_0: { name: 'Instrument pairs moved', group: 'Instrument control' },
  pairs_1: { name: 'Instrument pairs held', group: 'Instrument control' },
  pairs_2: { name: 'Instrument pairs beyond', group: 'Instrument control' },
  pairs_3: { name: 'Instrument pairs unchanged', group: 'Instrument control' },
  placebo_0: { name: 'Placebo pairs changed', group: 'Placebo control' },
  placebo_1: { name: 'Placebo pairs unchanged', group: 'Placebo control' },
}, url, feed,
  terms: 'The authors publish this results file on their project site; robots.txt has no restrictions and no separate extraction terms are stated.',
  async fetch(): Promise<LeaderboardRow[]> {
    const d = jsonAfter<{questions: number; tasks: string[]; models: Entry[]}>(await fetchText(feed), 'window.LEADERBOARD =');
    if (d.questions !== 226) throw new Error('EarthRecord question set changed');
    const rows = d.models.map(r => ({model: r.name, score: r.overall, low: r.interval[0], high: r.interval[1],
      metrics: Object.fromEntries([...r.tasks.map((v,i) => [d.tasks[i],v]), ...['computable','recognition','pairs','placebo'].flatMap(k => (r[k as keyof Entry] as number[]).map((v,i) => [`${k}_${i}`,v]))]),
    }));
    if (rows.length < 3) throw new Error('EarthRecord model rows missing');
    return rows;
  },
} satisfies Leaderboard;
