// CCBench (MMBench Chinese Culture). OpenCompass publishes its VLM leaderboard data as OpenVLM.json, the same
// file mmbench.ts reads: per model a META block (display name, evaluation time) and one entry per benchmark.
// CCBench.Overall (CircularEval accuracy, 0 to 100) is the score and the META time the row date.
// "GPT-4o (0513, detail-high)" becomes GPT-4o dated 2024-05-13 with the image detail level as the setting,
// as in mmbench.ts. The file is a snapshot whose newest rows date from early 2025.
import type { Leaderboard } from './types.ts';
import { openvlmRows } from '../lib/boards/openvlm.ts';

// the host serves this file over plain HTTP only
const FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';

const categories = ['Sketch Reasoning', 'Historical Figure', 'Calligraphy Painting', 'Scenery Building',
  'Food Clothes', 'Cultural Relic', 'Traditional Show'];

const board: Leaderboard = {
  benchmark: 'ccbench-mmbench',
  parts: Object.fromEntries(categories.map(name => [name, name])),
  verified: 'marked verified by OpenCompass',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${FEED} (CCBench.Overall)`,
  terms: "OpenCompass's published leaderboard data file, which states no license; the VLMEvalKit and MMBench repositories are Apache-2.0.",
  // the same OpenCompass spellings mmbench.ts places
  aliases: {
    'Claude3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
    'LLaVA-OneVision-72B': 'llava-onevision-72b',
    'InternVL2.5-78B': 'internvl2-5-78b',
    'InternVL2-40B': 'internvl2-40b',
  },
  fetch: () => openvlmRows(e => e.CCBench?.Overall, e => {
    const metrics: Record<string, number> = {};
    for (const key of categories) {
      const value = e.CCBench?.[key];
      if (typeof value === 'number') metrics[key] = value;
    }
    return metrics;
  }),
};
export default board;
