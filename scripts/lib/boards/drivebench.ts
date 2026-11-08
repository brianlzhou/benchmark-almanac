// DriveBench defines four driving task families. Clean, corrupted, and text-only inputs are whole-track run conditions.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../html.ts';

const FEED = "https://raw.githubusercontent.com/worldbench/drivebench/HEAD/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "drivebench",
  url: "https://github.com/worldbench/drivebench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Perception ( Clean )'));if(!t)throw new Error('DriveBench score table missing');
    const out:LeaderboardRow[]=[];const head=t[0].map(c=>c.text);
    for(const r of t.slice(1)){if(!r[0]?.text||r[0].text==='Human')continue;const model=r[0].text+(r[1].text!=='-'?' '+r[1].text:'');for(let i=3;i<head.length;i++){const score=num(r[i]?.text);if(score!==undefined)out.push({model:identity(model),score,setting:head[i]});}}
    return out;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
