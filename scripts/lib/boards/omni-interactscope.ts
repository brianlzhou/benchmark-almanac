// Omni-InteractScope separates explicit-request tasks T1-T7 from proactive assistance T8. Each track uses its published overall column.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../html.ts';

const FEED = "https://yinsongyan.github.io/Omni-InteractScope/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "omni-interactscope",
  url: "https://yinsongyan.github.io/Omni-InteractScope/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at yinsongyan.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out:LeaderboardRow[]=[];
    for(const t of tables(await fetchText(FEED))){const h=t[0]?.map(c=>c.text)??[];const i=h.indexOf('Avg.')>=0?h.indexOf('Avg.'):h.indexOf('Overall');if(i<0)continue;for(const r of t.slice(1)){const score=num(r[i]?.text);if(score===undefined||r.length!==h.length)continue;const metrics:Record<string,number>={};for(let j=3;j<h.length;j++){if(j===i||h[j].startsWith('Complete'))continue;const v=num(r[j]?.text);if(v!==undefined)metrics[h[j]]=v;}out.push({model:identity(r[0].text),score,setting:(h.includes('Avg.')?'Explicit request':'Proactive')+'; input '+r[2].text,metrics});}}
    if(!out.length)throw new Error('Omni-InteractScope tables missing');return out;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
