// WorldVQA: the official project page embeds its full model roster in WORLD_VQA_MASTER_DATA.
// Accuracy over the first eight categories (excluding People) is the headline percentage.
// Preserve every published model, including entries used by charts rather than the visible table.
// Category accuracy and F-score remain separate metrics. Undated snapshots remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const PAGE = 'https://worldvqa2026.github.io/WorldVQA/';
interface Model {
  id: string;
  name: string;
  scores: { accuracy: number; fscore: number; [key: string]: number | { correct: number; fscore: number; cga: number; unattempted: number } };
}
const board: Leaderboard = {
  benchmark: 'worldvqa',
  parts: {
    natureAccuracy: { name: 'Nature', group: 'Category' },
    cultureAccuracy: { name: 'Culture', group: 'Category' },
    objectsAccuracy: { name: 'Objects', group: 'Category' },
    transportAccuracy: { name: 'Transport', group: 'Category' },
    entertainmentAccuracy: { name: 'Entertainment', group: 'Category' },
    brandsAccuracy: { name: 'Brands', group: 'Category' },
    sportsAccuracy: { name: 'Sports', group: 'Category' },
    geoAccuracy: { name: 'Geography', group: 'Category' },
  },
  url: PAGE,
  feed: `${PAGE} (WORLD_VQA_MASTER_DATA)`,
  terms: 'The authors publish these results on their project page; the almanac credits and links WorldVQA. The dataset is Apache-2.0.',
  stats: { fScore: { name: 'F-score', unit: '%', better: 'higher' },
    nature: { name: 'Nature F-score', unit: '%', better: 'higher' }, natureNotAttempted: { name: 'Nature not attempted', unit: '%', better: 'lower' }, natureCorrectGivenAttempted: { name: 'Nature accuracy when attempted', unit: '%', better: 'higher' },
    geo: { name: 'Geo F-score', unit: '%', better: 'higher' }, geoNotAttempted: { name: 'Geo not attempted', unit: '%', better: 'lower' }, geoCorrectGivenAttempted: { name: 'Geo accuracy when attempted', unit: '%', better: 'higher' },
    culture: { name: 'Culture F-score', unit: '%', better: 'higher' }, cultureNotAttempted: { name: 'Culture not attempted', unit: '%', better: 'lower' }, cultureCorrectGivenAttempted: { name: 'Culture accuracy when attempted', unit: '%', better: 'higher' },
    objects: { name: 'Objects F-score', unit: '%', better: 'higher' }, objectsNotAttempted: { name: 'Objects not attempted', unit: '%', better: 'lower' }, objectsCorrectGivenAttempted: { name: 'Objects accuracy when attempted', unit: '%', better: 'higher' },
    transport: { name: 'Transport F-score', unit: '%', better: 'higher' }, transportNotAttempted: { name: 'Transport not attempted', unit: '%', better: 'lower' }, transportCorrectGivenAttempted: { name: 'Transport accuracy when attempted', unit: '%', better: 'higher' },
    entertainment: { name: 'Entertainment F-score', unit: '%', better: 'higher' }, entertainmentNotAttempted: { name: 'Entertainment not attempted', unit: '%', better: 'lower' }, entertainmentCorrectGivenAttempted: { name: 'Entertainment accuracy when attempted', unit: '%', better: 'higher' },
    brands: { name: 'Brands F-score', unit: '%', better: 'higher' }, brandsNotAttempted: { name: 'Brands not attempted', unit: '%', better: 'lower' }, brandsCorrectGivenAttempted: { name: 'Brands accuracy when attempted', unit: '%', better: 'higher' },
    sports: { name: 'Sports F-score', unit: '%', better: 'higher' }, sportsNotAttempted: { name: 'Sports not attempted', unit: '%', better: 'lower' }, sportsCorrectGivenAttempted: { name: 'Sports accuracy when attempted', unit: '%', better: 'higher' },
  },
  aliases: { 'x-ai_grok-4-fast-reasoning': 'grok-4-fast' },
  async fetch(): Promise<LeaderboardRow[]> {
    const source = jsonAfter<Model[]>((await fetchText(PAGE)).replace(/,\s*([}\]])/g, '$1'), 'const WORLD_VQA_MASTER_DATA =');
    const rows: LeaderboardRow[] = [];
    for (const r of source) {
      if (!Number.isFinite(r.scores.accuracy)) continue;
      const metrics: Record<string, number> = { fScore: r.scores.fscore };
      for (const [key, v] of Object.entries(r.scores)) {
        if (typeof v !== 'object' || !v) continue;
        if (Number.isFinite(v.fscore)) metrics[key] = v.fscore;
        if (Number.isFinite(v.correct)) metrics[`${key}Accuracy`] = v.correct;
        if (Number.isFinite(v.unattempted)) metrics[`${key}NotAttempted`] = v.unattempted;
        if (Number.isFinite(v.cga)) metrics[`${key}CorrectGivenAttempted`] = v.cga;
      }
      const ambiguous = /^(?:gpt-4o|gemini-2\.5-pro)$/i.test(r.id);
      rows.push({ model: ambiguous ? `${r.name} (snapshot unspecified)` : r.id, score: r.scores.accuracy,
        setting: /grok.*reasoning/i.test(r.id) ? 'reasoning' : undefined, metrics });
    }
    if (rows.length < 16) throw new Error(`WorldVQA: only ${rows.length} model rows`);
    return rows;
  },
};
export default board;
