// Peer Arena ranks models by Bradley–Terry peer rating. Its leaderboard component embeds the named and anonymous experiments separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://oddbit.ai/peer-arena/";
interface Run {shortName:[number,string];peerRating:[number,number];gamesPlayed:[number,number];positionWinRates:[number,[number,number][]];[key:string]:[number,unknown]}

const board: Leaderboard = {
  benchmark: "oddbit-peer-arena",
  url: "https://oddbit.ai/peer-arena/",
  feed,
  terms: "The maker offers downloadable game logs. The methodology gives no explicit reuse license. https://oddbit.ai/peer-arena/about/ The site publishes crawler-specific restrictions in robots.txt.",
  async fetch(){
    const page=await fetchText(feed);
    const raw=page.match(/<astro-island\b[^>]*component-url="[^"]*\/Leaderboard\.[^"]+"[^>]* props="([^"]*)"/)?.[1];
    if(!raw) throw new Error('Missing Peer Arena leaderboard');
    const props=JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
    const rows:LeaderboardRow[]=[];
    for(const setting of ['identity','anonymous']){
      const list=props.data[1][setting][1] as [number,Run][];
      if(list.length<17) throw new Error('Incomplete '+setting+' leaderboard');
      for(const [,r] of list){
        const model=r.shortName[1],score=r.peerRating[1];
        if(!model || !Number.isFinite(score)) throw new Error('Invalid peer rating');
        const metrics:Record<string,number>={};
        for(const [k,[,v]] of Object.entries(r)) if(typeof v==='number' && k!=='peerRating') metrics[k]=v;
        r.positionWinRates[1].forEach(([,v],i)=>metrics['position'+(i+1)]=v);
        rows.push({model,score,setting,trials:r.gamesPlayed[1],link:new URL('models/'+model+'/',feed).href,metrics});
      }
    }
    return rows;
  },
};
export default board;
