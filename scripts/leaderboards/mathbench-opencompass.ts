// MathBench (OpenCompass). open-compass.github.io/MathBench/ fills its table with PapaParse from two CSVs,
// MathBench-A.csv (application questions) and MathBench-T.csv (theory). The page opens on MathBench-A sorted
// by Average, the mean over the five stages (arithmetic, primary, middle, high, college), so that is the
// score here. The results date from the 2024 paper (ACL Findings), so dated API names get snapshot aliases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const PAGE = 'https://open-compass.github.io/MathBench/';
const FEED = `${PAGE}MathBench-A.csv`;

const board: Leaderboard = {
  benchmark: 'mathbench-opencompass',
  url: PAGE,
  feed: `${FEED} (Average)`,
  terms: 'Static CSV on the OpenCompass GitHub Pages site (no robots.txt); the MathBench repository is Apache-2.0.',
  aliases: {
    'GPT-4o-2024-05-13': 'gpt-4o-may-2024',
    'Llama-3-8B-Instruct': 'llama-3-8b',
    'Llama-3-70B-Instruct': 'llama-3-70b',
    'Qwen-7B-Chat': 'qwen-7b',
    'Qwen1_5-110B-Chat': 'qwen1-5-110b',
    'DeepSeek-67B-Chat': 'deepseek-llm-67b',
    'DeepSeek-V2-API': 'deepseek-v2-moe-236b-may-2024',
    'Yi-34B-Chat': 'yi-34b',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.Average);
      if (r.Model && Number.isFinite(score)) rows.push({ model: r.Model.trim(), score });
    }
    if (rows.length < 20) throw new Error(`only ${rows.length} MathBench rows`);
    return rows;
  },
};
export default board;
