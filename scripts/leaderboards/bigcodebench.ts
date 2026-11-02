// BigCodeBench (full, 1,140 tasks). bigcode-bench.github.io loads results.json for the full set and
// results-hard.json for the 148-task Hard subset (read by bigcodebench-hard.ts through bigcodebenchRows).
// Each model has pass@1 (0 to 100) on the Complete split (docstring prompts) and the Instruct split (short
// natural-language instructions), a date and a link. The page ranks by their average, rounded to one
// decimal, and shows no average when either split is missing, so the score here is that average and models
// with one split only are left out. Names such as "o1-2024-12-17 (temperature=1, reasoning=high)" carry the
// sampling settings: the reasoning level becomes the setting and the rest is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const BCB_PAGE = 'https://bigcode-bench.github.io/';
export const BCB_TERMS = 'Static JSON on the BigCodeBench GitHub Pages site; the bigcodebench repository is Apache-2.0.';
export const bcbFeed = (hard: boolean) => `${BCB_PAGE}${hard ? 'results-hard.json' : 'results.json'}`;

interface Entry {
  'pass@1'?: { complete?: number | null; instruct?: number | null };
  date?: string;
}

export async function bigcodebenchRows(hard: boolean): Promise<LeaderboardRow[]> {
  const data = await fetchJson<Record<string, Entry>>(bcbFeed(hard));
  const rows: LeaderboardRow[] = [];
  for (const [name, e] of Object.entries(data)) {
    const { complete, instruct } = e['pass@1'] ?? {};
    if (typeof complete !== 'number' || typeof instruct !== 'number') continue;
    let model = name.trim();
    let setting: string | undefined;
    const paren = model.match(/\s*\(([^)]*)\)$/);
    if (paren) {
      const effort = paren[1].match(/reasoning=(\w+)/)?.[1];
      setting = effort ?? (/w\/ reasoning/i.test(paren[1]) ? 'reasoning' : undefined);
      // "(2024-06-28)" marks a later run of the same API name, which the date below already carries
      model = model.slice(0, paren.index).trim();
    }
    rows.push({
      model,
      setting,
      score: Number(((complete + instruct) / 2).toFixed(1)),
      date: /^\d{4}-\d\d-\d\d$/.test(e.date ?? '') ? e.date : undefined,
    });
  }
  if (!rows.length) throw new Error(`no rows with both splits in ${bcbFeed(hard)}`);
  return rows;
}

/** BigCodeBench names the shared resolver cannot place. */
export const BCB_ALIASES: Record<string, string> = {};

const board: Leaderboard = {
  benchmark: 'bigcodebench',
  url: BCB_PAGE,
  feed: `${bcbFeed(false)} (mean of Complete and Instruct pass@1)`,
  terms: BCB_TERMS,
  aliases: BCB_ALIASES,
  fetch: () => bigcodebenchRows(false),
};
export default board;
