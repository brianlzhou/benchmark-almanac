// Speech Arena's Elo and Bradley-Terry views estimate the same public vote pool.
// Keep Elo as the headline and Bradley-Terry as a metric. Exclude models with no matches.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAfter } from '../lib/html.ts';
const URL='https://www.speecharena.org/leaderboard';
interface Entry {modelName:string;providerName:string;providerSlug:string;rating:number;matchesPlayed:number;wins:number;losses:number;winRate:number;lastUpdated:string;isProvisional:boolean}
const identity=(r:Entry)=>r.providerSlug+'|'+r.modelName;
const board:Leaderboard={
  benchmark:'speecharena',url:URL,feed:URL,
  terms:'Public Speech Arena leaderboard page. Site terms apply. The almanac credits and links the source.',
  async fetch():Promise<LeaderboardRow[]>{
    const raw=jsonAfter<Entry[]>(nextFlight(await fetchText(URL)),'"initialData":');
    await new Promise(r=>setTimeout(r,1050));
    const bt=new Map(jsonAfter<Entry[]>(nextFlight(await fetchText(URL+'?board=bradley-terry')),'"initialData":').map(r=>[identity(r),r]));
    const rows=raw.filter(r=>r.modelName&&Number.isFinite(r.rating)&&r.matchesPlayed>0).map(r=>{
      const metrics:Record<string,number>={matches:r.matchesPlayed,wins:r.wins,losses:r.losses,winRate:r.winRate,provisional:Number(r.isProvisional)};
      const b=bt.get(identity(r));if(b&&Number.isFinite(b.rating))metrics.bradleyTerry=b.rating;
      const model=/^(?:GPT|gpt)[- ]/.test(r.modelName)?r.modelName:r.providerName+' '+r.modelName;
      return {model,score:r.rating,date:r.lastUpdated?.slice(0,10),metrics};
    });
    if(!rows.length)throw new Error('Speech Arena observed ratings missing');
    return rows;
  },
};
export default board;
