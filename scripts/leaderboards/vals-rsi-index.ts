// Vals RSI Index on vals.ai. The server-rendered page has no index table: it lists results per task, four
// "Results" lists in div markup (Compression, LM training, Harness engineering, Post-training), each row with
// the model and its effort, the harness, the raw result, the task Score (0 to 1 on a reference-anchored log
// scale) and the cost of the run. The page defines the index as the mean of the four task scores, and its
// model profiles print that mean ("Index 0.36"), so the score here is the mean of the four Score values for
// each model that has all four. The cost is the mean of the four task costs. "(Nonthinking)" runs get the
// setting "non-thinking" in place of their effort.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

const PAGE = valsPage('rsi_index');
const TASKS = 4;
const ROW =
  /<span class="block truncate"[^>]*>([^<]+)<\/span>\s*<span class="foreground-secondary block text-2xs"[^>]*>([^<]*)<\/span>[\s\S]*?<span class="[^"]*w-44[^"]*"[^>]*>[^<]*<\/span>\s*<span class="[^"]*w-12[^"]*"[^>]*>([^<]*)<\/span>\s*<span class="[^"]*w-16[^"]*"[^>]*>([^<]*)<\/span>/g;

const board: Leaderboard = {
  benchmark: 'vals-rsi-index',
  url: PAGE,
  feed: `${PAGE} (server-rendered task results; index = mean of the four task scores)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  async fetch(): Promise<LeaderboardRow[]> {
    const blocks = (await fetchText(PAGE)).split(/>\s*Results\s*<\/span>/).slice(1);
    if (blocks.length !== TASKS) throw new Error(`expected ${TASKS} task result lists, found ${blocks.length}`);
    const runs = new Map<string, { harness: string; scores: number[]; costs: number[] }>();
    for (const b of blocks) {
      const list = b.slice(0, b.search(/What happened|<\/section>/));
      for (const m of list.matchAll(ROW)) {
        const name = text(m[1]);
        const score = num(m[3]);
        if (score === undefined) continue;
        const run = runs.get(name) ?? { harness: text(m[2]), scores: [], costs: [] };
        run.scores.push(score);
        const cost = num(m[4]);
        if (cost !== undefined) run.costs.push(cost);
        runs.set(name, run);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [name, run] of runs) {
      if (run.scores.length !== TASKS) continue;
      const effort = name.match(/\s*\(([\w-]+)\)$/);
      let model = effort ? name.slice(0, effort.index).trim() : name;
      let setting = effort?.[1].toLowerCase();
      if (/\(Nonthinking\)/i.test(model)) {
        model = model.replace(/\s*\(Nonthinking\)/i, '').trim();
        setting = 'non-thinking';
      }
      rows.push({
        model,
        score: run.scores.reduce((a, b) => a + b, 0) / TASKS,
        setting,
        harness: run.harness || undefined,
        cost: run.costs.length === TASKS ? run.costs.reduce((a, b) => a + b, 0) / TASKS : undefined,
      });
    }
    if (!rows.length) throw new Error('no Vals RSI Index rows');
    return rows;
  },
};
export default board;
