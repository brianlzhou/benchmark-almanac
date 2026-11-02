// MDPBench (multilingual document parsing). The Delores-Lin/MDPBench-leaderboard Space is a static page that
// renders leaderboard.json from its repository: per model or pipeline the "overall" score, the page-level
// mean of text, formula and table task scores (×100), which is the score, plus digital, photo and
// per-language splits. Rows are general VLMs, specialized OCR models and pipeline tools; the tools match no
// model record. The file's "updated" date is the row date, so the resolver picks the snapshots current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/Delores-Lin/MDPBench-leaderboard/resolve/main/leaderboard.json';

const board: Leaderboard = {
  benchmark: 'mdpbench',
  url: 'https://huggingface.co/spaces/Delores-Lin/MDPBench-leaderboard',
  feed: `${FEED} (overall)`,
  terms: 'Leaderboard file in the Delores-Lin/MDPBench-leaderboard Hugging Face Space, which states no license; scores are cited to the MDPBench maintainers.',
  aliases: {
    'doubao-seed-2-0-pro-260215': 'seed-2-0-pro',
    'Qwen3.5-Instruct-9B': 'qwen3-5-9b',
    'InternVL3_5-8B': 'internvl3-5-8b',
  },
  async fetch() {
    const data = await fetchJson<{ benchmark?: { updated?: string }; models: { name?: string; overall?: number }[] }>(FEED);
    const date = /^\d{4}-\d\d-\d\d$/.test(data.benchmark?.updated ?? '') ? data.benchmark!.updated : undefined;
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (m.name && typeof m.overall === 'number') rows.push({ model: m.name.trim(), score: m.overall, date });
    }
    return rows;
  },
};
export default board;
