// PhysClosureBench mean atomic score on a 0–10 scale. Research-closure categories count attempts; once/all percentages count tasks across three independent runs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://uncertainty2019.github.io/PhysClosureBench/site-data.js";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "physclosurebench",
  url: "https://uncertainty2019.github.io/PhysClosureBench/site-data.js",
  feed: FEED,
  terms: "Public results published by the benchmark authors at uncertainty2019.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const d=jsonAfter<any>(await fetchText(FEED),'window.PCB_DATA =');
    return d.models.map((r:any)=>({model:identity(r.name),score:r.mean,setting:'Mean atomic score (0–10); three runs per task',metrics:{taskCount:d.tasks.length,attemptCount:r.rc.reduce((a:number,b:number)=>a+b,0),rc0Attempts:r.rc[0],rc1Attempts:r.rc[1],rc2Attempts:r.rc[2],rc3Attempts:r.rc[3],rc4Attempts:r.rc[4],rc4AtLeastOnceTaskPercent:r.once,rc4AllThreeTaskPercent:r.all}}));
  },
};
export default board;
