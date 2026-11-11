// OmniCap-IF: Overall constraint-satisfaction rate (CSR), in percent. Retain Overall ISR and the
// format, content and modality scores as metrics. Exclude the human reference and section headings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://nju-link.github.io/OmniCap-IF/";
const board: Leaderboard = {
 benchmark: "omnicap-if", url: "https://nju-link.github.io/OmniCap-IF/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Overall');if(!t||t[1]?.[0]?.text!=='CSR')throw new Error('OmniCap table missing');const rows:LeaderboardRow[]=[];
for(const r of t.slice(2)){if(r.length!==10||r[0].text==='Human')continue;const score=num(r[1].text);if(score===undefined)continue;const keys=['overallISR','formatCSR','formatISR','contentCSR','contentISR','visualCSR','audioCSR','avCSR'];const metrics:Record<string,number>={};keys.forEach((k,i)=>{const v=num(r[i+2].text);if(v!==undefined)metrics[k]=v;});rows.push({model:r[0].text,score,metrics});}
return rows;
 },
};
export default board;
