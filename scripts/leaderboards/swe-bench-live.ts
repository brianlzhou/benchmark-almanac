// SWE-bench-Live. swe-bench-live.github.io fills its table from reports-0605.jsonl (one line per submission:
// name, set, total, resolved as a count or a list of instance ids, date). The page's default tab is the
// Python "Lite" split (300 frozen tasks), the split labs cite, so this reads set "lite"; the Full, Verified,
// MultiLang language tabs and Windows are other task sets. The score is resolved / total x 100, as the page
// computes it. Names read "Agent + Model (effort)": the last "+" part is the model, the rest the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const SITE = 'https://swe-bench-live.github.io';

interface Report {
  name: string;
  set: string;
  total: number;
  resolved: number | string[];
  date?: string;
}

const board: Leaderboard = {
  benchmark: 'swe-bench-live',
  url: `${SITE}/`,
  feed: `${SITE}/reports-0605.jsonl (set "lite")`,
  terms: 'Static file on GitHub Pages that the page loads; robots.txt allows it and the SWE-bench-Live repository is MIT-licensed.',
  aliases: {
    'Claude-4.6-Opus': 'claude-opus-4-6',
    'Claude-4.8-Opus': 'claude-opus-4-8',
    'Claude-4.5-Sonnet': 'claude-sonnet-4-5',
    'GPT5-Thinking': 'gpt-5',
    'DeepSeek V3': 'deepseek-v3-mar-2025',
  },
  fetch: () => fetchLiveRows(),
};
export async function fetchLiveRows(set = 'lite'): Promise<LeaderboardRow[]> {
    // the page names its data file in leaderboard.js; fall back to the known name
    const js = await fetchText(`${SITE}/leaderboard.js`).catch(() => '');
    const file = js.match(/fetch\(`([\w.-]+\.jsonl)/)?.[1] ?? 'reports-0605.jsonl';
    const text = await fetchText(`${SITE}/${file}`);
    const reports = text
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as Report);
    const rows: LeaderboardRow[] = [];
    for (const r of reports) {
      if (r.set !== set || !r.total) continue;
      const solved = Array.isArray(r.resolved) ? r.resolved.length : Number(r.resolved);
      const parts = r.name.split(/\s+\+\s+/);
      const last = parts.pop()!.trim();
      const effort = /\(([^)]*)\)\s*$/.exec(last)?.[1];
      rows.push({
        model: last.replace(/\s*\([^)]*\)\s*$/, ''),
        score: (solved / r.total) * 100,
        metrics: {resolved: solved, tasks: r.total},
        setting: effort?.toLowerCase(),
        harness: parts.join(' + ') || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date : undefined,
      });
    }
    return rows;
}
export default board;
