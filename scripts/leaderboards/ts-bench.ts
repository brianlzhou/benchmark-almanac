// ts-bench: the default v2 board reports Solved out of five SWE-Lancer tasks. The ratio becomes a percentage.
// The v1 Exercism results stay excluded. Agent names identify the harness. Total runtime remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
const FEED = "https://laiso.github.io/ts-bench/";

const board: Leaderboard = {
  benchmark: "ts-bench",
  url: "https://blog.lai.so/ts-bench/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Solved'));
    if(!t)throw new Error('ts-bench historical table missing');
    const rows:LeaderboardRow[]=[];
    for(const r of t.slice(1)){
      const m=r[4]?.text.match(/^(\d+)\/(\d+)$/);if(!m)continue;
      if(Number(m[2])!==5)throw new Error('ts-bench task count changed');
      let model=r[1].text;if(model==='gemini-2.5-flash')model+=' (snapshot unspecified)';
      const duration=r[5].text.match(/^([\d.]+)([mh])$/);
      rows.push({model,harness:r[0].text,score:Number(m[1])/Number(m[2])*100,date:r[6].text,metrics:duration?{totalSeconds:Number(duration[1])*(duration[2]==='h'?3600:60)}:undefined});
    }if(rows.length<10)throw new Error('ts-bench missing rows');return rows;
  },
};
export default board;
