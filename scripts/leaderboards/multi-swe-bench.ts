// Multi-SWE-bench. multi-swe-bench.github.io loads leaderboard.json from the dist branch of
// multi-swe-bench/experiments: one board per language, each with its task ids and per-submission resolved
// counts. The page's "All" view sums resolved counts over every language board, Python included, and
// divides by all task ids. The Python board is SWE-bench Verified (500 tasks), a separate benchmark here,
// so this importer sums the seven other languages (Java, TypeScript, JavaScript, Go, Rust, C, C++), the
// 1,632 tasks that define Multi-SWE-bench and that labs report. Like the page, it keeps only submissions
// present on every one of those boards. Language scores are metrics on the existing aggregate.
// Python belongs to SWE-bench Verified and is excluded. Rows are "Agent + Model".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/multi-swe-bench/experiments/refs/heads/dist/leaderboard.json';

interface Result {
  name: string;
  resolved: number;
  date?: string;
}
interface Language {
  name: string;
  data: { name: string; data: { all_ids: string[] }; results: Result[] }[];
}

const board: Leaderboard = {
  benchmark: 'multi-swe-bench',
  url: 'https://multi-swe-bench.github.io/',
  feed: `${FEED} (non-Python aggregate)`,
  terms: 'Repository file in multi-swe-bench/experiments (Apache-2.0) that the project site loads.',
  aliases: {
    'Claude-3.5-Sonnet(Oct)': 'claude-3-5-sonnet-october-2024',
    'GPT-4o-1120': 'gpt-4o-nov-2024',
    'DeepSeek-R1': 'deepseek-r1',
    'DeepSeek-V3': 'deepseek-v3',
    'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    // the March 2025 experimental release (runs dated 2025-04-26, before the May update)
    'Gemini-2.5-Pro': 'gemini-2-5-pro-mar-2025',
  },
  async fetch() {
    const allLangs = await fetchJson<Language[]>(FEED);
    const langs = allLangs.filter((l) => l.name !== 'Python');
    if (langs.length !== 7) throw new Error(`expected 7 non-Python languages, got ${langs.map((l) => l.name).join(', ')}`);
    let tasks = 0;
    const sums = new Map<string, { resolved: number; boards: number; date: string; metrics: Record<string, number> }>();
    for (const lang of langs)
      for (const set of lang.data) {
        tasks += set.data.all_ids.length;
        for (const r of set.results) {
          const s = sums.get(r.name) ?? { resolved: 0, boards: 0, date: '', metrics: {} };
          s.resolved += r.resolved;
          s.metrics[lang.name.toLowerCase()] = 100 * r.resolved / set.data.all_ids.length;
          s.boards++;
          if ((r.date ?? '') > s.date) s.date = r.date ?? '';
          sums.set(r.name, s);
        }
      }
    const boards = langs.reduce((n, l) => n + l.data.length, 0);
    const rows: LeaderboardRow[] = [];
    for (const [name, s] of sums) {
      if (s.boards !== boards) continue;
      const [harness, ...model] = name.split(' + ');
      if (!model.length) continue;
      // "OpenAI-o3-mini-high": vendor prefix dropped and the effort split off (the registry lists
      // "o3-mini (high)" as a plain alias, which would swallow the effort)
      let m = model.join(' + ').trim().replace(/^OpenAI-(?=o\d)/, '');
      const effort = m.match(/^(o\d[\w-]*?)-(low|medium|high)$/);
      if (effort) m = effort[1];
      rows.push({ model: m, setting: effort?.[2], harness: harness.trim(), score: (100 * s.resolved) / tasks, date: s.date || undefined, metrics: s.metrics });
    }
    return rows;
  },
};
export default board;
