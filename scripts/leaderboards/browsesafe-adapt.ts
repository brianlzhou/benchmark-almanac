// Separate BrowseSafe result set. Do not mix screenshot detection with text detection or adaptive attacks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://browsesafe.perplexity.ai/data/leaderboard.json';
const board:Leaderboard={
 benchmark:"browsesafe-adapt", url:'https://browsesafe.perplexity.ai/', feed:FEED,
 parts: {
   state: { name: 'State', group: 'Task type' },
   answer: { name: 'Answer', group: 'Task type' },
 },
 terms:'Public static results from Perplexity. The repository is MIT licensed. The almanac credits and links the source.',
 stats:{ seed:{name:'Seed attack success rate',unit:'%',better:'lower',note:'Attack success rate of the observed injection on the first attempt.'} },
 async fetch(){
 const data=await fetchJson<{boards:{id:string;rows:{model:string;[key:string]:unknown}[]}[]}>(FEED);
 const source=data.boards.find(b=>b.id==="adaptive");if(!source)throw new Error('BrowseSafe board missing');
 return source.rows.flatMap(r=>{const m=r["adaptive"] as Record<string,number>;if(!Number.isFinite(m?.adapted))return [];
 const { adapted, ...rest } = m;
 return [{model:r.model==='Kimi K2'?'Kimi K2 (snapshot unspecified)':r.model,score:adapted,metrics:rest} as LeaderboardRow];});
 }};export default board;
