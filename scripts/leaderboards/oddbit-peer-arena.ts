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
  stats: {
    humbleRating: { name: 'Humble rating', unit: 'rating', better: 'higher', note: 'Bradley Terry rating counting wins where the winner did not vote for itself.' },
    selfVoteRate: { name: 'Self vote rate', unit: 'score', note: 'Share of games in which a model voted for itself, from 0 to 1.' },
    gamesPlayed: { name: 'Games played', unit: 'count' },
    wins: { name: 'Wins', unit: 'count' },
    tieWins: { name: 'Tie wins', unit: 'count' },
    stalemates: { name: 'Stalemates', unit: 'count' },
    winRate: { name: 'Win rate', unit: 'score', better: 'higher', note: 'Share of games won, from 0 to 1.' },
    position1: { name: 'Position 1 win rate', unit: 'score', better: 'higher', note: 'Win rate for the first position, from 0 to 1.' },
    position2: { name: 'Position 2 win rate', unit: 'score', better: 'higher', note: 'Win rate for the second position, from 0 to 1.' },
    position3: { name: 'Position 3 win rate', unit: 'score', better: 'higher', note: 'Win rate for the third position, from 0 to 1.' },
    position4: { name: 'Position 4 win rate', unit: 'score', better: 'higher', note: 'Win rate for the fourth position, from 0 to 1.' },
    position5: { name: 'Position 5 win rate', unit: 'score', better: 'higher', note: 'Win rate for the fifth position, from 0 to 1.' },
  },
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
