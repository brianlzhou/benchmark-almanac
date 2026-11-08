// FinStepBench publishes three separate finance task suites. Each child reads one suite score, retaining reasoning effort.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { text, tables, num, jsonAfter } from '../html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://www.stepfun.com/step-5-preview";
const board: Leaderboard = {
  "benchmark": "finstepbench",
  "url": "https://www.stepfun.com/step-5-preview",
  "feed": "https://www.stepfun.com/step-5-preview",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const page = await fetchText(FEED);
    const script = [...page.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)].map(m => m[1]).find(s => /\/assets\/index-/.test(s));
    if (!script) throw new Error('Current page bundle missing');
    const source = await fetchText(new URL(script, FEED).href);
    const rows: LeaderboardRow[] = [];
    for (const panel of source.matchAll(/title:"(FinStepBench - [^"]+)",rows:\[([\s\S]*?)\]/g)) {
      for (const item of panel[2].matchAll(/model:"([^"]+)",logo:"[^"]+",value:(\d+(?:\.\d+)?)/g)) {
        const effort = item[1].match(/ \((High|Max)\)$/);
        rows.push({model: identity(item[1].replace(/ \((High|Max)\)$/, '')), score: Number(item[2]), setting: `${panel[1]}${effort ? `; ${effort[1]}` : ''}`});
      }
    }
    if (!rows.length) throw new Error('FinStepBench panels missing');
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
