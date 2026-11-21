// KorMedMCQA-V scores vision models on Korean medical licensing questions. The project JSON reports overall accuracy and splits by modality and image count.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://kormedmcqa-v.github.io/results.json";
interface Entry { is_reasoning: boolean; size: number | null; link: string; kormedmcqa_v: { overall: number; modality: Record<string, number>; by_image_count: Record<string, number> } }

const board: Leaderboard = {
  benchmark: "kormedmcqa-v",
  url: "https://kormedmcqa-v.github.io/",
  feed: FEED,
  terms: "The leaderboard repository uses the MIT license. https://github.com/kormedmcqa-v/kormedmcqa-v.github.io/blob/main/LICENSE The robots URL returns HTML.",
  async fetch() {
    const data = await fetchJson<Record<string, Entry>>(FEED);
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = Object.entries(data).map(([model, r]) => {
      const v = r.kormedmcqa_v;
      if (!model || !Number.isFinite(v.overall) || !v.modality || !v.by_image_count) throw new Error('Missing full-test Korean medical score');
      const metrics: Record<string, number> = {};
      for (const [group, splits] of [['Modality', v.modality], ['Image count', v.by_image_count]] as const) {
        for (const [label, score] of Object.entries(splits)) {
          if (!Number.isFinite(score)) throw new Error('Invalid medical split score');
          const key = group + '_' + label;
          parts[key] = { name: label, group }; metrics[key] = score;
        }
      }
      return { model, score: v.overall, setting: r.is_reasoning ? 'Reasoning' : undefined, params: r.size ?? undefined, link: r.link, metrics };
    });
    if (rows.length < 51) throw new Error('Expected at least 51 models');
    board.parts = parts;
    return rows;
  },
};
export default board;
