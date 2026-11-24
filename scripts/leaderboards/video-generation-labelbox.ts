// Labelbox Video Generation (original) ranked text-to-video models via multiway human comparisons before
// Labelbox switched to pairwise Elo in its second edition. This importer reads the Internet Archive snapshot
// from 2024-10-13 and extracts the embedded Next.js payload, preserving Elo, TrueSkill, average rank,
// rank-1 through rank-3 shares, and human rating distributions for realism, resolution, artifacts and prompt consistency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20241013081758';
const URL = `https://web.archive.org/web/${SNAPSHOT}/https://labelbox.com/leaderboards/video-generation/`;
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://labelbox.com/leaderboards/video-generation/`;

interface Entry {
  label?: string;
  model?: string;
  elo_rating?: number;
  trueskill_rating?: number;
  average_rank?: number;
  rank1_percentage?: number;
  rank2_percentage?: number;
  rank3_percentage?: number;
  is_realistic?: Record<string, number>;
  video_resolution?: Record<string, number>;
  artifacts_and_errors?: Record<string, number>;
  consistency_with_prompt?: Record<string, number>;
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
  benchmark: 'video-generation-labelbox',
  url: URL,
  feed: FEED,
  terms: 'Labelbox links its terms of service at https://docs.labelbox.com/page/terms-of-service. The Internet Archive preserves this public multiway leaderboard, and Benchmark Almanac credits and links Labelbox as the source.',
  stats: {
    trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' },
    averageRank: { name: 'Average rank', unit: 'count', better: 'lower' },
    first: { name: 'Ranked first share', unit: '%', better: 'higher' },
    second: { name: 'Ranked second share', unit: '%' },
    third: { name: 'Ranked third share', unit: '%', better: 'lower' },
    realismLowShare: { name: 'Realism low share', unit: '%', better: 'lower' },
    realismMediumShare: { name: 'Realism medium share', unit: '%' },
    realismHighShare: { name: 'Realism high share', unit: '%', better: 'higher' },
    resolutionLowShare: { name: 'Video resolution low share', unit: '%', better: 'lower' },
    resolutionMediumShare: { name: 'Video resolution medium share', unit: '%' },
    resolutionHighShare: { name: 'Video resolution high share', unit: '%', better: 'higher' },
    artifactsLowShare: { name: 'Artifacts and errors low share', unit: '%', better: 'higher' },
    artifactsMediumShare: { name: 'Artifacts and errors medium share', unit: '%' },
    artifactsHighShare: { name: 'Artifacts and errors high share', unit: '%', better: 'lower' },
    consistencyLowShare: { name: 'Prompt consistency low share', unit: '%', better: 'lower' },
    consistencyMediumShare: { name: 'Prompt consistency medium share', unit: '%' },
    consistencyHighShare: { name: 'Prompt consistency high share', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing __NEXT_DATA__ on archived Labelbox video leaderboard');
    const info = findInfo(JSON.parse(match[1]));
    if (!info || info.length < 3) throw new Error(`Expected at least 3 Labelbox video rows, got ${info?.length ?? 0}`);
    const rows: LeaderboardRow[] = [];
    for (const r of info) {
      const model = r.label?.trim() || r.model?.trim();
      if (!model || typeof r.elo_rating !== 'number' || !Number.isFinite(r.elo_rating)) {
        throw new Error(`Incomplete Labelbox video row: ${model}`);
      }
      const metrics: Record<string, number> = {};
      const put = (k: string, v?: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = Number(v.toFixed(4));
      };
      put('trueSkill', r.trueskill_rating);
      put('averageRank', r.average_rank);
      put('first', r.rank1_percentage);
      put('second', r.rank2_percentage);
      put('third', r.rank3_percentage);
      for (const lvl of ['Low', 'Medium', 'High']) {
        put(`realism${lvl}Share`, r.is_realistic?.[lvl]);
        put(`resolution${lvl}Share`, r.video_resolution?.[lvl]);
        put(`artifacts${lvl}Share`, r.artifacts_and_errors?.[lvl]);
        put(`consistency${lvl}Share`, r.consistency_with_prompt?.[lvl]);
      }
      rows.push({ model, score: Number(r.elo_rating.toFixed(2)), metrics });
    }
    return rows;
  },
};
export default board;
