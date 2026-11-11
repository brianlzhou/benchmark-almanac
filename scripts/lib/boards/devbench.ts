// DevBench has separate lifecycle task families. Implementation uses acceptance-test pass rate; unit-test pass rate remains auxiliary. Design metrics have no single headline.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num, text, tables } from '../html.ts';

const FEED = "https://raw.githubusercontent.com/open-compass/DevEval/main/README.md";
const board: Leaderboard = {
 benchmark: "devbench",
 url: "https://github.com/open-compass/DevEval",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=tables(await fetchText(FEED));const labels=[['Environment setup','Implementation acceptance pass','Implementation unit pass','Acceptance oracle test','Unit oracle test'],['Design principles with ties','Design faithfulness with ties','Design principles without ties','Design faithfulness without ties']];return ts.flatMap((t,k)=>t.slice(2).filter(r=>r.length>1&&!/Human/i.test(r[0].text)).flatMap(r=>labels[k].map((label,j)=>({model:r[0].text,score:num(r[j+1].text)!,setting:label,metrics:label==='Implementation acceptance pass'?{unitPass:num(r[3].text)!}:undefined})).filter(r=>r.score!==undefined)));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
