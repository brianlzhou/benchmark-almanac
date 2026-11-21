// SUPERB tests speech encoders on ten tasks. The board's default Paper view defines each metric as
// "1000 / (topline - baseline + 1e-12) * (value - baseline)" after reversing error rates.
// It averages the two slot-filling metrics, then averages the ten task scores and rounds to an integer.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/superbbenchmark/superbbenchmark.github.io/HEAD/src/data/public.json';
// Reference points from src/Data.js in the leaderboard repository.
const references: Record<string, [number, number]> = {
  PR_per: [17.99,96.47], KS_acc: [41.3826674,96.66], IC_acc: [9.649354219,98.76],
  SID_acc: [20.058174,90.3], ER_acc: [48.23672168,67.62], ASR_wer: [76.82,96.38],
  QbE_mtwv: [0.58,7.36], SF_f1: [69.64,89.81], SF_cer: [47.06,78.24],
  SV_eer: [90.44,94.89], SD_der: [89.95,94.38],
};
const parts: Record<string, BoardPart> = {};
for (const key of Object.keys(references)) {
  const [task, metric] = key.split('_');
  parts[key] = { name: task + ': ' + metric.toUpperCase(), unit: '%', better: /per|wer|cer|eer|der/.test(metric) ? 'lower' : 'higher' };
}
const board: Leaderboard = {
  benchmark: 'superb', url: 'https://superbbenchmark.github.io/', feed, parts,
  terms: 'SUPERB publishes its leaderboard and scoring code at https://github.com/superbbenchmark/superbbenchmark.github.io under the repository terms.',
  async fetch() {
    const { leaderboard } = await fetchJson<{ leaderboard: Record<string,string | number>[] }>(feed);
    const rows = leaderboard.filter(r => r.submitName !== 'FBANK').flatMap(r => {
      const metrics: Record<string, number> = {};
      let score = 0;
      for (const [key, [baseline, topline]] of Object.entries(references)) {
        const value = r[key + '_public'];
        if (value === '-' || value === null) return [];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing SUPERB metric ' + key);
        metrics[key] = value;
        const oriented = parts[key].better === 'lower' ? 100 - value : value;
        score += (oriented - baseline) * 1000 / (topline - baseline + 1e-12) / (key.startsWith('SF_') ? 2 : 1);
      }
      return [{ model: String(r.submitName), setting: String(r.task), score: Math.round(score / 10), metrics,
        submitter: r.name === 'paper' ? undefined : String(r.name) }];
    });
    return checked(rows, 19);
  },
};
export default board;
