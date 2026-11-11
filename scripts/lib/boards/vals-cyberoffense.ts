// CyberOffense range data, retained as input to the publisher-defined whole-score mean.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, text, jsLiteral } from '../html.ts';
const FEED = "https://www.vals.ai/benchmarks/cyber_offense";
const board: Leaderboard = {
  benchmark: "vals-cyberoffense", url: "https://www.vals.ai/benchmarks/cyber_offense", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  chart: {title:"Objectives completed versus tokens used",x:{key:"totalTokens",label:"Mean cumulative tokens",unit:"tokens",better:"lower"},y:{key:"score",label:"Objectives completed",unit:"score",better:"higher"},note:"Compare within each range. Completed-run means include cached input and reasoning tokens."},
  async fetch() {
    const source = await fetchText(FEED);
    const all = tables(source.replace(/<!--[\s\S]*?-->/g, "")).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    const path=source.match(/(?:https:\/\/www\.vals\.ai)?\/_astro\/ProgressChart\.[^"\s<>]+?\.js(?:\?[^"\s<>]*)?/)?.[0];
    if(!path)throw new Error("Missing live progress component");
    const script=await fetchText(new URL(path,FEED).href);const start=script.indexOf("{asOf:");
    if(start<0)throw new Error("Missing progress data");
    let depth=0,quote="",end=-1;
    for(let i=start;i<script.length;i++){const c=script[i];if(quote){if(c==="\\")i++;else if(c===quote)quote="";continue;}if('"`'.includes(c)){quote=c;continue;}if(c==="{"||c==="[")depth++;if(c==="}"||c==="]")depth--;if(!depth){end=i+1;break;}}
    if(end<0)throw new Error("Unclosed progress data");
    const literal=script.slice(start,end).replace(/`((?:\\.|[^`])*)`/g,(_,v)=>{if(v.includes("${"))throw new Error("Interpolated data");return JSON.stringify(v);}).replace(/([:,]\s*)\.(\d)/g,"$10.$2");
    const d=jsLiteral<any>(literal,0);
    for(const [range,entries] of Object.entries(d.leaderboard) as [string,any[]][]){for(const e of entries){
      if(e.note)continue;const runs=d.runs.filter((r:any)=>r.range===range&&r.model===e.model&&r.status==="finished");if(!runs.length)continue;
      const mean=(key:string)=>runs.reduce((s:number,r:any)=>s+r[key],0)/runs.length;
      const metrics={totalTokens:mean("tokens"),latency:mean("durationSeconds"),cost:mean("costUsd"),turns:mean("turns"),toolCalls:mean("toolCalls"),objectives:d.ranges[range],tokenBudget:d.budget,runs:runs.length};
      const model=e.model==="deepseek V4.1 Flash"?runs[0].modelKey.replace(/^deepseek\//,""):e.model;
      rows.push({model,score:e.milestones,setting:`${d.rangeLabels[range]}; mean of ${runs.length} finished run(s)`,harness:"Pi",cost:metrics.cost,metrics});
    }}
    if (!rows.length) throw new Error("No vals-cyberoffense score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export const sourceBoard = board;

