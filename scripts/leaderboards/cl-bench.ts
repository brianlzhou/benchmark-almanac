// CL-bench (context learning) on clbench.com. The static site's leaderboard script loads data/clb-data.json:
// one row per model and setting with overall and per-category solve rates as fractions (0 to 1) and their
// standard deviations. The table sorts by overall by default, so overall is the score (0 to 100). Rows
// without "(effort)" in the name are the default setting. CL-bench Life (cl-bench-life.ts) reads the
// sibling file through clbenchRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const clbenchFeed = (file: string) => `https://www.clbench.com/data/${file}`;
export const CLBENCH_TERMS =
  'Static JSON on the clbench.com GitHub Pages site, which states no terms; the CL-bench repository licenses its code Apache-2.0 under a Tencent notice.';

export async function clbenchRows(file: string): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{ model: string; overall?: number }[]>(clbenchFeed(file));
  const rows: LeaderboardRow[] = [];
  for (const r of data) {
    if (typeof r.overall !== 'number' || !r.model) continue;
    let model = r.model.trim();
    let setting: string | undefined;
    // "Grok 4.20 (non-reasoning)", "Hy3 preview (NoThink)", "Qwen 3.5 Plus (thinking)": the mode in brackets
    const mode = model.match(/\s*\((non-reasoning|reasoning|nothink|non-thinking|thinking)\)$/i);
    if (mode) {
      model = model.slice(0, mode.index).trim();
      setting = { nothink: 'non-thinking' }[mode[1].toLowerCase()] ?? mode[1].toLowerCase();
    }
    // "Qwen 3 Max Thinking", "DeepSeek V3.2 Thinking": a mode of the named model (the registry lists some of
    // these as plain aliases, which would drop the mode); "Kimi K2 Thinking" is its own model and is left alone
    const suffix = model.match(/^((?:Claude|Qwen|DeepSeek|Doubao|Hy)\b.*?)\s+Thinking$/i);
    if (suffix && !setting) {
      model = suffix[1];
      setting = 'thinking';
    }
    rows.push({ model, setting, score: r.overall * 100 });
  }
  if (!rows.length) throw new Error(`no rows in ${file}`);
  return rows;
}

export const CLBENCH_ALIASES: Record<string, string> = {
  'Hy3 preview': 'tencent-hy3-preview',
  'Qwen 3.5 Plus': 'qwen-3-5-plus-hosted-397b-a17b',
};

const board: Leaderboard = {
  benchmark: 'cl-bench',
  url: 'https://www.clbench.com/',
  feed: clbenchFeed('clb-data.json'),
  terms: CLBENCH_TERMS,
  aliases: CLBENCH_ALIASES,
  fetch: () => clbenchRows('clb-data.json'),
};
export default board;
