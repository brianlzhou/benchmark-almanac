// MeasureBench publishes real-world and synthetic test-set overall accuracy separately. Each child reads its Ovr column.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num, tables, text } from '../html.ts';

const FEED = "https://flageval-baai.github.io/MeasureBenchPage/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "measurebench",
  url: "https://flageval-baai.github.io/MeasureBenchPage/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at flageval-baai.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Real-world subset'));
    if (!table) throw new Error('MeasureBench results missing');
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(2)) for (let subset = 0; subset < 2; subset++) {
      const start = 1 + subset * 7, score = num(r[start]?.text);
      if (!r[0]?.text || score === undefined) continue;
      const metrics: Record<string, number> = {};
      ['value', 'unit', 'dial', 'digital', 'linear', 'complex'].forEach((k, i) => { const n = num(r[start + i + 1]?.text); if (n !== undefined) metrics[k] = n; });
      rows.push({ model: identity(r[0].text), score, setting: subset ? 'synthetic' : 'real-world', metrics });
    }
    if (!rows.length) throw new Error('MeasureBench scores missing');
    return rows;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
