// Labelbox Speech Generation (original) ranked text-to-speech models via multiway human comparisons before
// Labelbox switched to pairwise Elo in its second edition. This importer reads the Internet Archive snapshot
// from 2024-11-10 and extracts the embedded Next.js payload, preserving Elo, TrueSkill, average rank, WER,
// rank-1 through rank-6 shares, and human rating distributions for noise, prosody, context awareness,
// naturalness and pronunciation accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SNAPSHOT = '20241110133206';
const URL = `https://web.archive.org/web/${SNAPSHOT}/https://labelbox.com/leaderboards/speech-generation/`;
const FEED = `https://web.archive.org/web/${SNAPSHOT}id_/https://labelbox.com/leaderboards/speech-generation/`;

interface Entry {
  label?: string;
  model?: string;
  elo_rating?: number;
  trueskill_rating?: number;
  average_rank?: number;
  WER?: number;
  rank1_percentage?: number;
  rank2_percentage?: number;
  rank3_percentage?: number;
  rank4_percentage?: number;
  rank5_percentage?: number;
  rank6_percentage?: number;
  noise?: Record<string, number>;
  prosody_accuracy?: Record<string, number>;
  context_awareness?: Record<string, number>;
  speech_naturalness?: Record<string, number>;
  pronunciation_accuracy?: Record<string, number>;
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
  benchmark: 'speech-generation-labelbox',
  url: URL,
  feed: FEED,
  terms: 'Labelbox links its terms of service at https://docs.labelbox.com/page/terms-of-service. The Internet Archive preserves this public multiway leaderboard, and Benchmark Almanac credits and links Labelbox as the source.',
  stats: {
    trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' },
    averageRank: { name: 'Average rank', unit: 'count', better: 'lower' },
    wer: { name: 'Word error rate', unit: '%', better: 'lower' },
    first: { name: 'Ranked first share', unit: '%', better: 'higher' },
    second: { name: 'Ranked second share', unit: '%', better: 'higher' },
    third: { name: 'Ranked third share', unit: '%' },
    fourth: { name: 'Ranked fourth share', unit: '%' },
    fifth: { name: 'Ranked fifth share', unit: '%', better: 'lower' },
    sixth: { name: 'Ranked sixth share', unit: '%', better: 'lower' },
    noiseNoneShare: { name: 'No noise share', unit: '%', better: 'higher' },
    noiseLowShare: { name: 'Low noise share', unit: '%' },
    noiseMediumShare: { name: 'Medium noise share', unit: '%' },
    noiseHighShare: { name: 'High noise share', unit: '%', better: 'lower' },
    prosodyLowShare: { name: 'Prosody accuracy low share', unit: '%', better: 'lower' },
    prosodyMediumShare: { name: 'Prosody accuracy medium share', unit: '%' },
    prosodyHighShare: { name: 'Prosody accuracy high share', unit: '%', better: 'higher' },
    contextLowShare: { name: 'Context awareness low share', unit: '%', better: 'lower' },
    contextMediumShare: { name: 'Context awareness medium share', unit: '%' },
    contextHighShare: { name: 'Context awareness high share', unit: '%', better: 'higher' },
    naturalnessLowShare: { name: 'Speech naturalness low share', unit: '%', better: 'lower' },
    naturalnessMediumShare: { name: 'Speech naturalness medium share', unit: '%' },
    naturalnessHighShare: { name: 'Speech naturalness high share', unit: '%', better: 'higher' },
    pronunciationLowShare: { name: 'Pronunciation accuracy low share', unit: '%', better: 'lower' },
    pronunciationMediumShare: { name: 'Pronunciation accuracy medium share', unit: '%' },
    pronunciationHighShare: { name: 'Pronunciation accuracy high share', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) throw new Error('Missing __NEXT_DATA__ on archived Labelbox speech leaderboard');
    const info = findInfo(JSON.parse(match[1]));
    if (!info || info.length < 6) throw new Error(`Expected at least 6 Labelbox speech rows, got ${info?.length ?? 0}`);
    const rows: LeaderboardRow[] = [];
    for (const r of info) {
      const model = r.model?.trim() || r.label?.trim();
      if (!model || typeof r.elo_rating !== 'number' || !Number.isFinite(r.elo_rating)) {
        throw new Error(`Incomplete Labelbox speech row: ${model}`);
      }
      const metrics: Record<string, number> = {};
      const put = (k: string, v?: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = Number(v.toFixed(4));
      };
      put('trueSkill', r.trueskill_rating);
      put('averageRank', r.average_rank);
      put('wer', r.WER);
      put('first', r.rank1_percentage);
      put('second', r.rank2_percentage);
      put('third', r.rank3_percentage);
      put('fourth', r.rank4_percentage);
      put('fifth', r.rank5_percentage);
      put('sixth', r.rank6_percentage);
      for (const lvl of ['None', 'Low', 'Medium', 'High']) put(`noise${lvl}Share`, r.noise?.[lvl]);
      for (const lvl of ['Low', 'Medium', 'High']) {
        put(`prosody${lvl}Share`, r.prosody_accuracy?.[lvl]);
        put(`context${lvl}Share`, r.context_awareness?.[lvl]);
        put(`naturalness${lvl}Share`, r.speech_naturalness?.[lvl]);
        put(`pronunciation${lvl}Share`, r.pronunciation_accuracy?.[lvl]);
      }
      rows.push({ model, score: Number(r.elo_rating.toFixed(2)), metrics });
    }
    return rows;
  },
};
export default board;
