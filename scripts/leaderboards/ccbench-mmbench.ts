// CCBench (MMBench Chinese Culture). OpenCompass publishes its VLM leaderboard data as OpenVLM.json, the same
// file mmbench.ts reads: per model a META block (display name, evaluation time) and one entry per benchmark.
// CCBench.Overall (CircularEval accuracy, 0 to 100) is the score and the META time the row date.
// "GPT-4o (0513, detail-high)" becomes GPT-4o dated 2024-05-13 with the image detail level as the setting,
// as in mmbench.ts. The file is a snapshot whose newest rows date from early 2025.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

// the host serves this file over plain HTTP only
const FEED = 'http://opencompass.openxlab.space/assets/OpenVLM.json';

interface Entry {
  META?: { Method?: [string, string?]; Time?: string };
  CCBench?: { Overall?: number };
}

const board: Leaderboard = {
  benchmark: 'ccbench-mmbench',
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
  async fetch() {
    const { results } = await fetchJson<{ results: Record<string, Entry> }>(FEED);
    const rows: LeaderboardRow[] = [];
    for (const e of Object.values(results)) {
      const score = e.CCBench?.Overall;
      let model = e.META?.Method?.[0]?.trim();
      // the registry's only Reka Edge is the 2026 release, not the 2024 model on this board
      if (!model || typeof score !== 'number' || /^RekaEdge$/i.test(model)) continue;
      let date = e.META?.Time?.replace(/\//g, '-');
      let setting: string | undefined;
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
