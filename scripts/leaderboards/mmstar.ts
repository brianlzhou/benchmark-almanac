// MMStar. The MMStar team (USTC and Shanghai AI Lab) shows only an early 19-model table on its project page
// and points readers to the OpenCompass multimodal leaderboard, which its co-authors run. That board's data
// is OpenVLM.json, read through openvlmRows in openvlm-leaderboard.ts: MMStar.Overall (accuracy, 0 to 100)
// is the score, and "GPT-4o (0513, detail-high)" becomes GPT-4o dated 2024-05-13 with the image detail level
// as the setting. The file is a snapshot (2025-09-17) whose newest rows date from 2025.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS, openvlmRows } from './openvlm-leaderboard.ts';

const board: Leaderboard = {
  benchmark: 'mmstar',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${OPENVLM_FEED} (MMStar.Overall)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows((e) => e.MMStar?.Overall),
};
export default board;
