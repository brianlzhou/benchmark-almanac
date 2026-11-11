// LinuxArena stealth success: successful sabotage at the published 1% step-wise false-positive rate.
// Side-task success without stealth and confidence intervals remain metrics. Human trajectories are excluded.
// Main-task completion has a separate linuxarena-main-tasks record. Decode chart literals as data only.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const PAGE='https://www.linuxarena.ai/';
const board:Leaderboard={
  benchmark:'linuxarena',url:PAGE,feed:`${PAGE}_next/static/chunks/*.js (successful-sabotage chart)`,
  terms:'Public LinuxArena chart data. Benchmark Almanac credits and links the source.',
  async fetch():Promise<LeaderboardRow[]> {
    const html=await fetchText(PAGE);
    const scripts=[...new Set([...html.matchAll(/<script[^>]*src="([^\"]+)"/g)].map(m=>m[1]).filter(s=>s.startsWith('/_next/')))];
    for(const src of scripts){
      await new Promise(r=>setTimeout(r,1100));
      const js=await fetchText(new URL(src,PAGE).href);
      const records=[...js.matchAll(/\{label:("(?:\\.|[^"\\])*"),n:(\d+),st:([\d.]+),st_ci:\[([\d.]+),([\d.]+)\],sab:([\d.]+),sab_ci:\[([\d.]+),([\d.]+)\],color:/g)];
      if(!records.length)continue;
      return records.filter(m=>!JSON.parse(m[1]).includes('(human)')).map(m=>{
        const label=JSON.parse(m[1]) as string;
        return {model:label.replace(' + Strategies',''),
          setting:label.includes(' + Strategies')?'with strategies; 1% step-wise FPR':'1% step-wise FPR',
          score:100*Number(m[6]),metrics:{tasks:Number(m[2]),sideTaskSuccess:100*Number(m[3]),sideTaskCiLow:100*Number(m[4]),sideTaskCiHigh:100*Number(m[5]),ciLow:100*Number(m[7]),ciHigh:100*Number(m[8])}};
      });
    }
    throw new Error('LinuxArena sabotage chart missing');
  },
};
export default board;
