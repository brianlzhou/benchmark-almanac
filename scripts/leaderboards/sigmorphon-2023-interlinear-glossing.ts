// SIGMORPHON ranks glossing submissions by micro-averaged word accuracy. The organizers publish word and morpheme accuracy for both input tracks.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { markdownTables } from "../lib/boards/github-markdown.ts";
const board: Leaderboard = {
  benchmark: "sigmorphon-2023-interlinear-glossing",
  url: "https://github.com/sigmorphon/2023glossingST/blob/main/results.md",
  feed: "https://raw.githubusercontent.com/sigmorphon/2023glossingST/main/results.md",
  terms: "The organizers license code under Apache 2.0 and list separate licenses for each dataset. They specify no separate license for the results table at https://github.com/sigmorphon/2023glossingST#licensing. The raw GitHub host returned 404 for robots.txt.",
  stats: { morphemeAccuracy: { name: 'Morpheme accuracy', unit: '%', better: 'higher' } },
  async fetch() {
    const tables = markdownTables(await fetchText(this.feed));
    if (tables.length !== 4) throw new Error('Expected two tracks and two metrics');
    return tables.slice(0,2).flatMap((t,i)=>{
      const languages = t[0].slice(1,8);
      if (t[0][8] !== 'AVG' || t.length < (i===0?7:11)) throw new Error('Missing SIGMORPHON results');
      this.parts = Object.fromEntries(languages.map(k=>[k,k]));
      return t.slice(1).map(r=>{
        const secondary = tables[2+i].find(x=>x[0]===r[0]);
        if (!secondary) throw new Error('Missing morpheme result for '+r[0]);
        const metrics: Record<string,number> = {morphemeAccuracy:Number(secondary[8])};
        languages.forEach((k,j)=>{if(r[j+1]!=='-') metrics[k]=Number(r[j+1]);});
        if (!r[8] || !Number.isFinite(Number(r[8])) || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid glossing result');
        return {model:r[0],score:Number(r[8]),setting:'Track '+(i+1)+(r[9]==='X'?' (partial submission)':''),metrics};
      });
    });
  },
};
export default board;
