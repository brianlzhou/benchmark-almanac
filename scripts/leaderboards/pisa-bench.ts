// PISA-Bench tests visual reasoning on PISA questions in six languages.
// The official leaderboard ranks models by Avg. and publishes the mean and standard deviation by language.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const parts = { en: 'English', de: 'German', fr: 'French', it: 'Italian', es: 'Spanish', ch: 'Chinese' };
const feed = 'https://huggingface.co/spaces/PisaBench/pisa-bench-leaderboard/raw/main/current_results.json';
interface Entry { model: string; avg: number; delta_non_en: number; link?: string; scores: Record<string, {mean: number; std: number}> }
const board: Leaderboard = {
  benchmark: 'pisa-bench', parts, url: 'https://huggingface.co/spaces/PisaBench/pisa-bench-leaderboard', feed,
  terms: 'The authors publish the Space under the platform terms at https://huggingface.co/terms-of-service.',
  aliases: { 'Qwen2.5-VL-3B-Instruct': 'qwen2-5-vl-3b', 'Qwen2.5-VL-7B-Instruct': 'qwen2-5-vl-7b', 'Qwen2.5-VL-72B-Instruct': 'qwen2-5-vl-72b' },
  async fetch() {
    const data = await fetchJson<{ languages: string[]; models: Entry[] }>(feed);
    if (data.languages.join() !== Object.keys(parts).join()) throw new Error('PISA-Bench languages changed');
    const rows = data.models.map(r => {
      if (!Number.isFinite(r.avg) || !Number.isFinite(r.delta_non_en)) throw new Error('Missing PISA-Bench aggregate');
      const metrics: Record<string, number> = { deltaNonEnglish: r.delta_non_en };
      for (const language of data.languages) {
        const cell = r.scores[language];
        if (!cell || !Number.isFinite(cell.mean) || !Number.isFinite(cell.std)) throw new Error('Missing language score');
        metrics[language] = cell.mean;
        metrics[language + 'Std'] = cell.std;
      }
      return { model: r.model, score: r.avg, link: r.link, metrics };
    });
    return checked(rows, 19);
  },
};
export default board;
