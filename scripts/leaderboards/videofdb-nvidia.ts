// VideoFDB: the page opens on Perception, whose published Overall is the score.
// A2A and AV2A are paired whole-set input configurations. Generation scores belong
// in metrics, not separate headline rows; timing milliseconds become seconds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://research.nvidia.com/labs/amri/projects/video-fdb/leaderboard.html";
const board: Leaderboard = {
  benchmark: "videofdb-nvidia", url: "https://research.nvidia.com/labs/amri/projects/video-fdb/leaderboard.html", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    for(let i=0;i<all.length;i++){const t=all[i];if(!t[0]?.includes("Overall ↑"))continue;let group="";for(const r of t.slice(1)){if(r.length===1){group=r[0];continue;}const score=num(r[4]);if(score===undefined||/^Human/i.test(r[0]))continue;const metrics:Record<string,number>={};for(let j=1;j<4;j++)metrics[t[0][j].replace(" ↑","")]=num(r[j])!;const timing=r[5]?.match(/([\d.]+)%\s*\/\s*([\d.]+)\s*ms/);if(timing)Object.assign(metrics,{timingRate:Number(timing[1]),latency:Number(timing[2])/1000});rows.push({model:r[0],score,setting:`${i===0?"Conversation":"Avatar"}; ${group}`,metrics});}}
    if (!rows.length) throw new Error("No videofdb-nvidia score rows");
    return rows.filter(r=>r.setting?.startsWith('Conversation;')).map(r=>{
      const generation=rows.find(x=>x.model===r.model&&x.setting?.startsWith('Avatar;'));
      return {...r,setting:r.setting!.includes('Audio-only')?'audio-only':'audio+video',
        metrics:{...r.metrics,...(generation?{generation:generation.score}:{})}};
    });
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

