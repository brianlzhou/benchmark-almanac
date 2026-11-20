// A-Bench (how well multimodal models judge AI-generated images) on the OpenCompass VLM leaderboard, which
// the almanac links as its board. The Space's A-Bench tab sorts by "Overall", accuracy over both parts of the
// benchmark (0 to 100), so that is the score. Read through openvlmRows in openvlm-leaderboard.ts.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS, OPENVLM_URL, openvlmRows } from './openvlm-leaderboard.ts';

const board: Leaderboard = {
  benchmark: 'a-bench',
  verified: 'marked verified by OpenCompass',
  url: OPENVLM_URL,
  feed: `${OPENVLM_FEED} (ABench.Overall)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  parts: {},
  fetch: () => openvlmRows((e) => e.ABench?.Overall, e => {
    const metrics: Record<string, number> = {};
    for (const [key, value] of Object.entries(e.ABench ?? {})) {
      if (!key.includes(' -> ') || !Number.isFinite(value)) continue;
      const path = key.replace(/_/g, ' ').split(' -> ');
      board.parts![key] = { name: path.pop()!, group: path.join(' / ') };
      metrics[key] = value;
    }
    return metrics;
  }),
};
export default board;
