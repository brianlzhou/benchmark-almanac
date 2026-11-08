// VATEX English captioning challenge: published CIDEr is the headline score.
// Chinese captions belong to the separate vatex-zh record. BLEU-4, Meteor and
// Rouge-L remain metrics; named team submissions stay unlisted systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://eric-xw.github.io/vatex-website/captioning.html";
const board: Leaderboard = {
  benchmark: "vatex", url: "https://eric-xw.github.io/vatex-website/captioning.html", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(const [i,table] of all.filter(t=>t[0].includes("CIDEr")).entries())for(const r of table.slice(1)){const score=num(r[5]);if(score===undefined)continue;rows.push({model:r[1],score,setting:i===0?"English":"Chinese",metrics:Object.fromEntries(table[0].slice(2,5).flatMap((h,j)=>{const v=num(r[j+2]);return v===undefined?[]:[[h,v]];}))});}
    if (!rows.length) throw new Error("No vatex score rows");
    return rows.filter(r=>r.setting==="English");
  },
};
export default board;
