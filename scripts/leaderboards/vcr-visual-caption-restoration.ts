// VCR (Visual Caption Restoration) on the OpenCompass VLM leaderboard, which the almanac links as its board.
// The VCR authors supplied the runs (the Space credits them) on 500-sample subsets of each track. The
// Space's VCR tab sorts by "Overall-Jaccard", the Jaccard similarity over the English and Chinese, easy and
// hard tracks (0 to 100), so that is the score. Read through openvlmRows in openvlm-leaderboard.ts.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS, OPENVLM_URL, openvlmRows } from './openvlm-leaderboard.ts';

const board: Leaderboard = {
  benchmark: 'vcr-visual-caption-restoration',
  url: OPENVLM_URL,
  feed: `${OPENVLM_FEED} (VCR.Overall-Jaccard)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows((e) => e.VCR?.['Overall-Jaccard']),
};
export default board;
