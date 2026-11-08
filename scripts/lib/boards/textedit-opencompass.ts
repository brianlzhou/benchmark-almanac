// TextEdit separates Real and Virtual image test sets. Import only the Full edition, using the published judged Avg, with other metrics attached.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../html.ts';

const FEED = "https://raw.githubusercontent.com/open-compass/TextEdit/main/README.md";
const board: Leaderboard = {
 benchmark: "textedit-opencompass", url: "https://github.com/open-compass/TextEdit", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const ts=tables(await fetchText(FEED));const rows:LeaderboardRow[]=[];for(const [autoIdx,humanIdx,split] of [[0,1,'Full'],[2,3,'Mini-set 500']] as const){const auto=ts[autoIdx],human=ts[humanIdx];if(human?.[1]?.at(-1)?.text!=='Avg')throw new Error('Missing TextEdit table');for(const r of human.slice(2)){if(r.length!==14)continue;const a=auto.find(a=>a[0]?.text===r[0].text);for(let i=0;i<2;i++){const metrics:Record<string,number>={};for(let j=0;j<6;j++)metrics[human[1][i*6+j].text]=num(r[2+i*6+j].text)!;if(a)for(let j=0;j<7;j++)metrics[auto[1][i*7+j].text]=num(a[2+i*7+j].text)!;rows.push({model:r[0].text,score:num(r[7+i*6].text)!,setting:`${split}; ${i?'Virtual':'Real'}; judged average`,metrics});}}}return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
