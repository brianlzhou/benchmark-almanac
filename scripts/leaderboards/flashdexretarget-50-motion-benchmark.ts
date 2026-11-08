// FlashDexRetarget: headline retargeting success is SR SPIDER across all fifty motions, in percent.
// Each robot and single/multi-reference training mode runs the whole set. Stricter success rates are metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://holiday-robot.github.io/FlashDexRetarget/";
const board: Leaderboard = {
  benchmark: "flashdexretarget-50-motion-benchmark", url: "https://holiday-robot.github.io/FlashDexRetarget/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const t=all.find(t=>t[0]?.includes("Motion"));if(!t)throw new Error("Missing retargeting table");let robot="";for(const r of t.slice(1)){if(r.length===1){robot=r[0];continue;}for(let i=2;i<=2;i++){const rate=num(r[i]);if(rate===undefined)continue;rows.push({model:r[0],score:rate*100,setting:`${robot}; ${r[1]} motion`,metrics:{sr_mt_obj:num(r[3])!*100,sr_mt:num(r[4])!*100,poseErrorMm:num(r[5])!,rotationErrorRad:num(r[6])!,gpuHours:num(r[7])!}});}}
    if (!rows.length) throw new Error("No flashdexretarget-50-motion-benchmark score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

