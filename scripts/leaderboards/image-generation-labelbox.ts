// Labelbox Image Generation (original) ranked text-to-image models via multiway human comparisons before
// Labelbox switched to pairwise Elo in its second edition. This importer reads the Internet Archive snapshot
// from 2024-10-13 and extracts the embedded Next.js payload, preserving Elo, TrueSkill, average rating,
// rank-1 through rank-5 shares, and visual appeal, prompt alignment and overall preference distributions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20241013063144';
const URL = `https://web.archive.org/web/${SNAPSHOT}/https://labelbox.com/leaderboards/image-generation/`;
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://labelbox.com/leaderboards/image-generation/`;

interface Entry {
  label?: string;
  model?: string;
  elo_rating?: number;
  trueskill_rating?: number;
  average_rating?: number;
  rank1_percentage?: number;
  rank2_percentage?: number;
  rank3_percentage?: number;
  rank4_percentage?: number;
  rank5_percentage?: number;
  visual_appeal?: Record<string, number>;
  prompt_alignment?: Record<string, number>;
  overall_preference?: Record<string, number>;
}

function findInfo(node: unknown): Entry[] | undefined {
  if (!node || typeof node !== 'object') return undefined;
  const rec = node as Record<string, unknown>;
  if (Array.isArray(rec.info) && rec.info.length && typeof (rec.info[0] as Entry)?.elo_rating === 'number') {
    return rec.info as Entry[];
  }
  for (const v of Object.values(rec)) {
    const found = findInfo(v);
    if (found) return found;
  }
  return undefined;
}

const board: Leaderboard = {
  benchmark: 'image-generation-labelbox',
  url: URL,
  feed: FEED,
  terms: 'Labelbox links its terms of service at https://docs.labelbox.com/page/terms-of-service. The Internet Archive preserves this public multiway leaderboard, and Benchmark Almanac credits and links Labelbox as the source.',
  stats: {
    trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' },
    averageRating: { name: 'Average rank', unit: 'count', better: 'lower' },
    first: { name: 'Ranked first share', unit: '%', better: 'higher' },
    second: { name: 'Ranked second share', unit: '%', better: 'higher' },
    third: { name: 'Ranked third share', unit: '%', better: 'higher' },
    fourth: { name: 'Ranked fourth share', unit: '%', better: 'lower' },
    fifth: { name: 'Ranked fifth share', unit: '%', better: 'lower' },
    visualAppeal1: { name: 'Visual appeal rating 1 share', unit: '%' },
    visualAppeal2: { name: 'Visual appeal rating 2 share', unit: '%' },
    visualAppeal3: { name: 'Visual appeal rating 3 share', unit: '%' },
    visualAppeal4: { name: 'Visual appeal rating 4 share', unit: '%' },
    visualAppeal5: { name: 'Visual appeal rating 5 share', unit: '%', better: 'higher' },
    promptAlignment1: { name: 'Prompt alignment rating 1 share', unit: '%' },
    promptAlignment2: { name: 'Prompt alignment rating 2 share', unit: '%' },
    promptAlignment3: { name: 'Prompt alignment rating 3 share', unit: '%' },
    promptAlignment4: { name: 'Prompt alignment rating 4 share', unit: '%' },
    promptAlignment5: { name: 'Prompt alignment rating 5 share', unit: '%', better: 'higher' },
    overallPreferenceLowShare: { name: 'Overall preference low share', unit: '%', better: 'lower' },
    overallPreferenceMediumShare: { name: 'Overall preference medium share', unit: '%' },
    overallPreferenceHighShare: { name: 'Overall preference high share', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing __NEXT_DATA__ on archived Labelbox image leaderboard');
    const info = findInfo(JSON.parse(match[1]));
    if (!info || info.length < 5) throw new Error(`Expected at least 5 Labelbox image rows, got ${info?.length ?? 0}`);
    const rows: LeaderboardRow[] = [];
    for (const r of info) {
      const model = r.label?.trim() || r.model?.trim();
      if (!model || typeof r.elo_rating !== 'number' || !Number.isFinite(r.elo_rating)) {
        throw new Error(`Incomplete Labelbox image row: ${model}`);
      }
      const metrics: Record<string, number> = {};
      const put = (k: string, v?: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = Number(v.toFixed(4));
      };
      put('trueSkill', r.trueskill_rating);
      put('averageRating', r.average_rating);
      put('first', r.rank1_percentage);
      put('second', r.rank2_percentage);
      put('third', r.rank3_percentage);
      put('fourth', r.rank4_percentage);
      put('fifth', r.rank5_percentage);
      for (const n of ['1', '2', '3', '4', '5']) {
        put(`visualAppeal${n}`, r.visual_appeal?.[n]);
        put(`promptAlignment${n}`, r.prompt_alignment?.[n]);
      }
      for (const lvl of ['Low', 'Medium', 'High']) put(`overallPreference${lvl}Share`, r.overall_preference?.[lvl]);
      rows.push({ model, score: Number(r.elo_rating.toFixed(2)), metrics });
    }
    return rows;
  },
};
export default board;
