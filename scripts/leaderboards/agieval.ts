// AGIEval: the official README publishes English, Chinese and all-task averages, with zero/few-shot
// settings. Keep v1.1 AGIEval-all averages; language averages are metrics. Exclude v1.0.
// Undated API names are marked unspecified so the resolver cannot assign a later snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/ruixiangcui/AGIEval/main/README.md";
const board: Leaderboard = {
 benchmark: "agieval", url: "https://github.com/ruixiangcui/AGIEval", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const md=await fetchText(FEED);const rows: LeaderboardRow[]=[];
for(const block of md.split(/^## /m).slice(1)) {
 const setting=block.split('\n')[0].trim(); if(!/^AGIEval-/.test(setting))continue;
 for(const l of block.split('\n')) {
  const c=l.split('|').slice(1,-1).map(s=>s.trim());if(c.length!==3)continue;
  const score=num(c[2]);if(score===undefined)continue;
  const old=c[0].endsWith('*');let model=c[0].replace(/\*$/,'').trim();
  if(/^(GPT-4o|GPT-3\.5-Turbo|Mistral 7b)$/i.test(model))model+=' [snapshot unspecified]';
  rows.push({model,score,setting:`${old?'v1.0':'v1.1'}; ${setting}`});
 }
}
const overall=rows.filter(r=>/^v1\.1; AGIEval-all /.test(r.setting??''));
for(const r of overall){const shot=r.setting!.replace('v1.1; AGIEval-all ','');r.metrics={};for(const lang of ['en','zh']){const sub=rows.find(s=>s.model===r.model&&s.setting===`v1.1; AGIEval-${lang} ${shot}`);if(sub)r.metrics[lang]=sub.score;}r.setting='v1.1; '+shot;}
if(!overall.length)throw new Error('No AGIEval v1.1 overall averages');return overall;
 },
};
export default board;
