// CFLUE publishes knowledge accuracy and an application average over its task metrics. The application average is a score, not percentage accuracy.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';

function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let current: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if ((line.match(/\|/g) ?? []).length < 2) { if (current.length) out.push(current); current = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => text(c.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, "")));
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, "")))) continue;
    current.push(cells);
  }
  if (current.length) out.push(current);
  return out;
}
const FEED = "https://raw.githubusercontent.com/aliyun/cflue/master/README.md";
const board: Leaderboard = {
  benchmark: "cflue", url: "https://github.com/aliyun/cflue", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = markdownTables(source);
    const rows: LeaderboardRow[] = [];
    for(const t of all){const knowledge=t[0]?.includes("Acc"),application=t[0]?.includes("Fin_TC");if(!knowledge&&!application)continue;for(const r of t.slice(1)){const score=num(r[knowledge?1:9]);if(score===undefined||!r[0])continue;const metrics:Record<string,number>={};for(let i=2;i<r.length;i++){const n=num(r[i]);if(n!==undefined)metrics[`${t[0][i]}_${i}`]=n;}rows.push({model:r[0],score,setting:knowledge?"Knowledge accuracy":"Application; Fin_TC accuracy",metrics});}}
    if (!rows.length) throw new Error("No cflue score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export const sourceBoard = board;


// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
