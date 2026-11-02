// Android Bench 2.0 (Google). developer.android.com/bench is server-rendered and holds two leaderboards as
// HTML tables: "Long-horizon task results" (Android Bench 2.0, 30 tasks) headed "Model - Agent | Pass rate
// (%) | CI range (%) | Completion rate (%) | ...", and "1.0 task results" (Android Bench 1.0) headed
// "Model | Score (%) | ...". This importer reads the first: pass rate is the score and the agent (Claude
// Code, Codex and others) the harness; the effort in brackets becomes the setting. The cost column is per
// full run of the suite, not per task, so it is not kept. androidbench.ts reads the 1.0 table through
// androidBenchTable.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text, type Cell } from '../lib/html.ts';

export const ANDROID_PAGE = 'https://developer.android.com/bench';
export const ANDROID_TERMS =
  'Server-rendered page on developer.android.com; robots.txt allows /bench and page content is under the site’s Content License (CC BY 4.0).';

/** The first table on the Android Bench page whose header starts with `first` and has a `score` column. */
export async function androidBenchTable(first: RegExp, score: RegExp): Promise<{ head: string[]; rows: Cell[][] }> {
  const t = tables(await fetchText(ANDROID_PAGE)).find((rows) => first.test(rows[0]?.[0]?.text ?? '') && rows[0].some((c) => score.test(c.text)));
  if (!t) throw new Error(`Android Bench table ${first} not found`);
  return { head: t[0].map((c) => c.text), rows: t.slice(1) };
}

/** "Claude Opus 5.5 (max)" -> model and effort. */
export function splitEffort(name: string): { model: string; setting?: string } {
  const m = name.match(/\s*\(([\w-]+)\)$/);
  return m ? { model: name.slice(0, m.index).trim(), setting: m[1].toLowerCase() } : { model: name.trim() };
}

const board: Leaderboard = {
  benchmark: 'android-bench-2-0',
  url: ANDROID_PAGE,
  feed: `${ANDROID_PAGE} (server-rendered HTML table "Long-horizon task results", Pass rate)`,
  terms: ANDROID_TERMS,
  aliases: {},
  async fetch() {
    const { head, rows: body } = await androidBenchTable(/^Model - Agent/, /^Pass rate/);
    const iScore = head.findIndex((h) => /^Pass rate/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of body) {
      // the cell holds the model name, then the agent, then an icon name ("chevron_right")
      const parts = r[0].html.split(/<\/?(?:span|div|p|br)[^>]*>/i).map(text).filter((s) => s && !/^chevron_right$/.test(s));
      const score = num(r[iScore]?.text);
      if (!parts.length || score === undefined) continue;
      const { model, setting } = splitEffort(parts[0]);
      rows.push({ model, setting, score, harness: parts[1] });
    }
    return rows;
  },
};
export default board;
