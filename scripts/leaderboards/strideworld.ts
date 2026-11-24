// StrideWorld: evaluates 15 interactive video world models on 3D camera-action controllability across 30 scenes
// (3,640 generated videos per model), measuring response rate, rigidity offset, pace, multi-step composition, and
// MUSIQ image quality. Reads the embedded JSON lb-data script from the Hugging Face Space raw index.html.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/strideworld-release/strideworld-leaderboard';
const FEED = `${PAGE}/raw/main/index.html`;

interface StridePayload {
  models: {
    name: string;
    interface?: string;
    values: {
      resp: number;
      offset: number;
      ratio: number;
      pace: number;
      comp: number;
      near: number;
      stall: number;
      enderr: number;
      swap: number;
      musiq: number;
    };
  }[];
}

const board: Leaderboard = {
  benchmark: 'strideworld',
  url: PAGE,
  feed: FEED,
  terms: 'Published openly on Hugging Face Spaces by the StrideWorld authors.',
  headline: 'Composition score (0 to 100), combining multi-step route and swap-pair scores across translation and yaw commands.',
  stats: {
    response: { name: 'Response rate', unit: '%', better: 'higher', note: 'Share of single-action videos in which the camera moves the commanded way.' },
    rigidityOffset: { name: 'Rigidity offset', unit: 'score', better: 'lower', note: 'Median offset in degrees of held-out anchors from their rigid positions.' },
    paceRatio: { name: 'Pace ratio', unit: 'score', note: 'Observed over predicted camera motion after 16 steps, where 1.0 is steady.' },
    paceScore: { name: 'Pace score', unit: 'score', better: 'higher', note: 'Usable control score of a held action.' },
    nearTarget: { name: 'Near target', unit: '%', better: 'higher', note: 'Routes ending within one stride of the prediction.' },
    stallRate: { name: 'Stall rate', unit: '%', better: 'lower', note: 'Routes containing a stalled step.' },
    endError: { name: 'End error', unit: 'score', better: 'lower', note: 'Median end error of completed routes in strides.' },
    swapGap: { name: 'Swap gap', unit: 'score', better: 'lower', note: 'Median gap in strides between the ends of a swap pair.' },
    musiq: { name: 'MUSIQ', unit: 'score', better: 'higher', note: 'MUSIQ no-reference image quality score.' },
  },
  async fetch() {
    const html = await fetchText(FEED);
    const m = html.match(/<script[^>]*id="lb-data"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) throw new Error('StrideWorld lb-data JSON script not found');
    const data = JSON.parse(m[1]) as StridePayload;
    const out: LeaderboardRow[] = data.models.map((entry) => {
      const v = entry.values;
      if (!Number.isFinite(v.comp)) throw new Error(`Invalid StrideWorld comp score for ${entry.name}`);
      const metrics: Record<string, number> = {};
      if (Number.isFinite(v.resp)) metrics.response = Number(v.resp.toFixed(2));
      if (Number.isFinite(v.offset)) metrics.rigidityOffset = Number(v.offset.toFixed(2));
      if (Number.isFinite(v.ratio)) metrics.paceRatio = Number(v.ratio.toFixed(2));
      if (Number.isFinite(v.pace)) metrics.paceScore = Number(v.pace.toFixed(2));
      if (Number.isFinite(v.near)) metrics.nearTarget = Number(v.near.toFixed(2));
      if (Number.isFinite(v.stall)) metrics.stallRate = Number(v.stall.toFixed(2));
      if (Number.isFinite(v.enderr)) metrics.endError = Number(v.enderr.toFixed(2));
      if (Number.isFinite(v.swap)) metrics.swapGap = Number(v.swap.toFixed(2));
      if (Number.isFinite(v.musiq)) metrics.musiq = Number(v.musiq.toFixed(2));
      return {
        model: entry.name.trim(),
        setting: entry.interface?.trim() || undefined,
        score: Number(v.comp.toFixed(2)),
        metrics,
      };
    });
    if (out.length < 10) throw new Error(`StrideWorld returned only ${out.length} rows`);
    return out;
  },
};
export default board;
