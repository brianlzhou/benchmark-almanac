// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// PRISM-Bench tests joint audio and video generation. The board JSON sums calibrated scores within each prompt set.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';

const url = 'https://huggingface.co/spaces/prismbench/prismbench-leaderboard';
const feed = url + '/resolve/main/data/leaderboard.json';
const parts = { mixed: 'Mixed-AB', onScreen: 'On-Screen', offScreen: 'Off-Screen' };
type Entry = { display_name: string, final_score: number, overall_raw: number, n_samples: number,
  scores: Record<string, Record<string, number>>, subtype_totals: Record<string, number> };
type SetResults = { models: Entry[], metrics: string[], subtypes: string[] };
const board: Leaderboard = {
  benchmark: 'prism-bench-audio-video', url, feed, parts,
  terms: 'The PRISM-Bench Space uses CC BY-NC 4.0, https://creativecommons.org/licenses/by-nc/4.0/.',
  aliases: { 'Seedance2.0': 'dreamina-seedance-2-0', 'Veo 3.1': 'veo-3-1-audio', 'Veo 3': 'veo-3-audio' },
  headline: 'The board reports no overall score, so this is the plain mean of its three Final Scores. Off-Screen uses nine dimensions and the other sets use twelve.',
  async fetch() {
    const { sets } = await fetchJson<{ sets: Record<string, SetResults> }>(feed);
    const models = new Map<string, Record<string, number>>();
    for (const [key, name] of Object.entries(parts)) {
      const group = sets[name];
      for (const entry of group.models) {
        const metrics = models.get(entry.display_name) ?? {};
        if (key in metrics) throw new Error('Duplicate prompt set for ' + entry.display_name);
        metrics[key] = entry.final_score;
        metrics[key + 'Raw'] = entry.overall_raw;
        metrics[key + 'Samples'] = entry.n_samples;
        for (const subtype of group.subtypes) {
          metrics[key + subtype] = entry.subtype_totals[subtype];
          for (const metric of group.metrics) metrics[key + subtype + metric] = entry.scores[metric][subtype];
        }
        if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Missing PRISM-Bench score');
        models.set(entry.display_name, metrics);
      }
    }
    const rows = Array.from(models).filter(([, metrics]) => Object.keys(parts).every(k => k in metrics))
      .map(([model, metrics]) => ({ model, metrics, score: (metrics.mixed + metrics.onScreen + metrics.offScreen) / 3 }));
    return checked(rows, 8);
  },
};
export default board;
