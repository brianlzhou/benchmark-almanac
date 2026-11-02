// MMBench-CN v1.1. Read from OpenCompass's OpenVLM.json like mmbench-en-v1-1.ts (which holds the reader):
// MMBench_TEST_CN_V11.Overall, CircularEval accuracy on the Chinese v1.1 test split, the only v1.1 split
// OpenCompass publishes.
import type { Leaderboard } from './types.ts';
import { OPENVLM_ALIASES, OPENVLM_FEED, OPENVLM_TERMS, openVlmRows } from './mmbench-en-v1-1.ts';

const board: Leaderboard = {
  benchmark: 'mmbench-cn-v1-1',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${OPENVLM_FEED} (MMBench_TEST_CN_V11.Overall)`,
  terms: OPENVLM_TERMS,
  aliases: OPENVLM_ALIASES,
  fetch: () => openVlmRows('MMBench_TEST_CN_V11'),
};
export default board;
