// Android Bench 2.0 (Google). developer.android.com/bench is server-rendered and holds two leaderboards as
// HTML tables: "Long-horizon task results" (Android Bench 2.0, 30 tasks) headed "Model - Agent | Pass rate
// (%) | CI range (%) | Completion rate (%) | ...", and "1.0 task results" (Android Bench 1.0) headed
// "Model | Score (%) | ...". This importer reads the first: pass rate is the score and the agent (Claude
// Code, Codex and others) the harness. The effort in brackets becomes the setting. "Avg cost ($)" is per
// full run of the 30 tasks, so costPer is 'run'. Each model dialog gives weights and the runs passed per task.
// Report pass rates by task, average completion rates, and the trial count when all tasks share a denominator.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text, type Cell } from '../lib/html.ts';

export const ANDROID_PAGE = 'https://developer.android.com/bench';
export const ANDROID_TERMS =
  'Server-rendered page on developer.android.com; robots.txt allows /bench and page content is under the site’s Content License (CC BY 4.0).';

/** The first table on the Android Bench page whose header starts with `first` and has a `score` column. */
export async function androidBenchTable(first: RegExp, score: RegExp, html?: string): Promise<{ head: string[]; rows: Cell[][] }> {
  const t = tables(html ?? await fetchText(ANDROID_PAGE)).find((rows) => first.test(rows[0]?.[0]?.text ?? '') && rows[0].some((c) => score.test(c.text)));
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
  costPer: 'run',
  async fetch() {
    const page = await fetchText(ANDROID_PAGE);
    const { head, rows: body } = await androidBenchTable(/^Model - Agent/, /^Pass rate/, page);
    const dialogs = new Map<string, string>();
    for (const section of page.split('<div class="devsite-dialog android-bench-llm-modal"').slice(1)) {
      const id = section.match(/^\s*id="([^"]+)"/)?.[1];
      const table = section.match(/<table class="android-bench-llm-modal-table">[\s\S]*?<\/table>/)?.[0];
      if (id && table) dialogs.set(id, table);
    }
    const parts: NonNullable<Leaderboard['parts']> = {};
    board.parts = parts;
    const col = (re: RegExp) => head.findIndex((h) => re.test(h));
    const iScore = col(/^Pass rate/);
    const [iCi, iCompletion, iTime, iCost] = [/C[Il] range/, /^Completion rate/, /^Avg latency \(h\)/, /^Avg cost/].map(col);
    const rows: LeaderboardRow[] = [];
    for (const r of body) {
      // the cell marks its parts by class: model name (with a reasoning-effort span inside) and agent
      const cell = r[0].html;
      const effort = text(cell.match(/class="android-bench-score-reasoning-effort">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const name = text((cell.match(/class="android-bench-score-model-name">([\s\S]*?)<\/span>\s*<br/)?.[1] ?? '').replace(/<span[\s\S]*$/, ''));
      const agent = text(cell.match(/class="android-bench-score-agent">([\s\S]*?)<\/span>/)?.[1] ?? '');
      const score = num(r[iScore]?.text);
      if (!name || score === undefined) continue;
      const setting = effort.replace(/[()]/g, '').trim().toLowerCase();
      const metrics: Record<string, number> = {};
      // "24.0 — 56.0"
      const ci = iCi >= 0 ? r[iCi]?.text.match(/([\d.]+)\s*[—–-]\s*([\d.]+)/) : null;
      const weights = cell.match(/weight___(open|closed)\b/)?.[1];
      const id = cell.match(/data-modal-dialog-id="([^"]+)"/)?.[1];
      const detail = id && dialogs.get(id);
      const denominators = new Set<number>();
      if (detail) {
        for (const task of tables(detail)[0]?.slice(1) ?? []) {
          const passed = task[3]?.text.match(/^(\d+)\s*\/\s*(\d+)$/);
          if (!passed || !Number(passed[2])) continue;
          denominators.add(Number(passed[2]));
          const key = task[0].text.toLowerCase().replace(/[^a-z0-9]+([a-z0-9])?/g, (_, c?: string) => c?.toUpperCase() ?? '');
          parts[key] = {name: task[0].text, group: task[1].text};
          metrics[key] = 100 * Number(passed[1]) / Number(passed[2]);
          const completion = num(task[2]?.text);
          if (completion !== undefined) metrics[key + 'Completion'] = completion;
        }
      }
      const completion = iCompletion >= 0 ? num(r[iCompletion]?.text) : undefined;
      if (completion !== undefined) metrics.completion = completion;
      const hours = iTime >= 0 ? num(r[iTime]?.text) : undefined;
      if (hours !== undefined) metrics.runHours = hours;
      rows.push({
        model: name,
        setting: setting && setting !== 'default' ? setting : undefined,
        score,
        harness: agent || undefined,
        open: weights ? weights === 'open' : undefined,
        trials: denominators.size === 1 ? [...denominators][0] : undefined,
        low: ci ? Number(ci[1]) : undefined, high: ci ? Number(ci[2]) : undefined,
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
