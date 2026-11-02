// AutoCodeBench (Tencent Hunyuan). The project site's leaderboard.html is an unfilled template and the
// repository's leaderboards are images, so the paper's main results table is read: pass@1 per model on the
// full AutoCodeBench (3,920 problems, 20 languages), split into reasoning and non-reasoning modes, as HTML
// on arxiv.org (pinned to v1, CC0). The Average column is the score; the mode becomes the setting
// ("thinking" or "non-thinking"). The first such table is the full set (the second is ACB-Lite). A static
// paper table, so rows carry the paper's date (v1, 2025-08-12). Snapshot dates in brackets are dropped
// from names and dated snapshots get aliases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://arxiv.org/html/2508.09101v1';
const DATE = '2025-08-12';

const board: Leaderboard = {
  benchmark: 'autocodebench-tencent',
  url: 'https://autocodebench.github.io/',
  feed: `${PAGE} (main results table, Average)`,
  terms: 'arXiv robots.txt allows /html (crawl delay 15 s; one request per sync); the paper is CC0.',
  aliases: {
    'GPT4.1': 'gpt-4-1',
    'GPT4o 2024-11-20': 'gpt-4o-nov-2024',
    'Gemini2.5 Pro': 'gemini-2-5-pro-jun-2025',
    'Kimi-K2-0711-Preview': 'kimi-k2-jul-2025',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-Coder-480B-A35B-Instruct': 'qwen3-coder-480b-a35b',
    'Seed1.6-Thinking-250615': 'seed-1-6-thinking',
    'DeepSeek-Coder-33B-Instruct': 'deepseek-coder-33b',
    'DeepSeek-Coder-6.7B-Instruct': 'deepseek-coder-6-7b',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows.some((r) => r[0]?.text === 'Reasoning Mode') && rows[0]?.some((c) => c.text === 'Average'));
    if (!t) throw new Error('main results table not found');
    const iAvg = t[0].findIndex((c) => c.text === 'Average');
    const rows: LeaderboardRow[] = [];
    let mode: string | undefined;
    for (const r of t.slice(1)) {
      const name = r[0]?.text ?? '';
      if (/^Reasoning Mode$/i.test(name)) mode = 'thinking';
      else if (/^Non-Reasoning Mode$/i.test(name)) mode = 'non-thinking';
      const score = num(r[iAvg]?.text);
      if (!mode || r.length < 3 || score === undefined || /^(Count|Current Upper Bound)$/.test(name)) continue;
      // "Claude Opus 4 (20250514)" -> "Claude Opus 4"; "GPT4o (2024-11-20)" keeps its date as an alias key
      const dated = name.match(/^(.*?)\s*\((\d{4}-\d\d-\d\d)\)$/);
      const model = dated && /^GPT4o/.test(dated[1]) ? `${dated[1]} ${dated[2]}` : name.replace(/\s*\([\d-]+\)$/, '').replace(/-(enable|enabled|disabled)$/, '');
      // a name with its own effort ("o3-high") keeps that effort as the setting
      rows.push({ model, score, setting: /-(low|medium|high)$/i.test(model) ? undefined : mode, date: DATE });
    }
    return rows;
  },
};
export default board;
