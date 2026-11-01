// MMBench (v1.0, English test split). OpenCompass, which made MMBench, publishes its VLM leaderboard data as
// OpenVLM.json: per model a META block (display name, org, evaluation time, Verified) and one entry per
// benchmark. MMBench_TEST_EN.Overall (CircularEval accuracy, 0 to 100) is the score. The META time is the
// row date, so the resolver picks the snapshot current then; "GPT-4o (0513, detail-high)" becomes GPT-4o
// dated 2024-05-13 with the image detail level as the setting. The file is a snapshot (2025-09-17) whose
// newest rows date from early 2025. MMBench v1.1 is in the same file but on its test split, while the
// almanac's v1.1 record is the dev split, so it is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

// the host serves this file over plain HTTP only
const FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';

interface Entry {
  META?: { Method?: [string, string?]; Time?: string };
  MMBench_TEST_EN?: { Overall?: number };
}

const board: Leaderboard = {
  benchmark: 'mmbench',
  url: 'https://rank.opencompass.org.cn/leaderboard-multimodal',
  feed: `${FEED} (MMBench_TEST_EN.Overall)`,
  terms: "OpenCompass's published leaderboard data file, which states no licence; the VLMEvalKit and MMBench repositories are Apache-2.0.",
  aliases: {
    'Claude3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
    'LLaVA-OneVision-72B': 'llava-onevision-72b',
    'InternVL2.5-78B': 'internvl2-5-78b',
    'InternVL2-40B': 'internvl2-40b',
  },
  async fetch() {
    const { results } = await fetchJson<{ results: Record<string, Entry> }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of Object.values(results)) {
      const score = e.MMBench_TEST_EN?.Overall;
      let model = e.META?.Method?.[0]?.trim();
      if (!model || typeof score !== 'number') continue;
      let date = e.META?.Time?.replace(/\//g, '-');
      let setting: string | undefined;
      // "GPT-4o (0513, detail-high)": snapshot month and day, and the image detail level
      const snap = model.match(/\s*\((\d\d)(\d\d), (detail-\w+)\)$/);
      if (snap && date) {
        date = `${date.slice(0, 4)}-${snap[1]}-${snap[2]}`;
        setting = snap[3];
        model = model.slice(0, snap.index).trim();
      }
      rows.push({ model, score, setting, date });
    }
    return rows;
  },
};
export default board;
