// MMStar. The MMStar team (USTC and Shanghai AI Lab) shows only an early 19-model table on its project page
// and points readers to the OpenCompass multimodal leaderboard, which its co-authors run. That board's data
// is OpenVLM.json, read through openvlmRows in openvlm-leaderboard.ts: MMStar.Overall (accuracy, 0 to 100)
// is the score, and "GPT-4o (0513, detail-high)" becomes GPT-4o dated 2024-05-13 with the image detail level
// as the setting. Keep the six capability scores and weight metadata. The file is a snapshot (2025-09-17) whose newest rows date from 2025.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS } from './openvlm-leaderboard.ts';

import { openvlmRows } from '../lib/boards/openvlm.ts';

const capabilities = ['coarse perception', 'fine-grained perception', 'instance reasoning', 'logical reasoning', 'math', 'science & technology'];

const board: Leaderboard = {
  benchmark: 'mmstar',
  parts: Object.fromEntries(capabilities.map(name => [name, { name, group: 'Capability' }])),
  verified: 'marked verified by OpenCompass',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${OPENVLM_FEED} (MMStar.Overall)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openvlmRows((e) => e.MMStar?.Overall, (e) => {
    const metrics: Record<string, number> = {};
    for (const key of capabilities) {
      const value = e.MMStar?.[key];
      if (typeof value === 'number') metrics[key] = value;
    }
    return metrics;
  }),
};
export default board;
