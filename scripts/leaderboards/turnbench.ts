// TurnBench overall recall percentages from the server-rendered ranking.
// False-positive rate and median latency remain separate; high-FPR systems are retained with qualification labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const FEED = "https://turnbench.sesame.com/";
const board: Leaderboard = {
 benchmark: "turnbench", url: "https://turnbench.sesame.com/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const html=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const m of html.matchAll(/<div role="row"[^>]*>([\s\S]*?)<\/div>/g)){
 const cells=[...m[1].matchAll(/<span role="cell"[^>]*>([\s\S]*?)<\/span>/g)].map(m=>text(m[1]));if(cells.length!==5)continue;
 const score=num(cells[2]),fpr=num(cells[3]),ms=num(cells[4]);if(score===undefined||fpr===undefined||ms===undefined)continue;
 const model=cells[1].replace(/†/g,'').trim();rows.push({model,score:score*100,setting:'Overall'+(fpr>0.15?'; FPR above qualification threshold':''),metrics:{falsePositiveRate:fpr*100,latency:ms/1000}});
}if(!rows.length)throw new Error('Missing TurnBench rows');return rows;
 },
};
export default board;
