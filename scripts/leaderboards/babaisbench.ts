// Read Stage 0 pass rates, harness, cost and the three attempt records for each level.
// The leaderboard labels the three-attempt column pass@3.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://quesma.com/benchmarks/babaisbench/";
const board: Leaderboard = {
  benchmark: "babaisbench", url: "https://quesma.com/benchmarks/babaisbench/", feed: FEED,
  reference: ['Terminus-2'],
  terms: "Public official results, subject to the source repository license and host terms.",
  chart: {title:"Intro levels cost frontier",x:{key:"totalCost",label:"Total cost of 24 attempts",unit:"$",better:"lower",log:true},y:{key:"score",label:"pass@1",unit:"%",better:"higher"}},
  async fetch() {
    const source = await fetchText(FEED);
    const table = tables(source.replace(/<!--[\s\S]*?-->/g, "")).find(t => t[0]?.some(c => c.text.startsWith("pass@1")));
    if (!table) throw new Error("Missing Stage 0 table");
    const head = table[0].map(c=>c.text);
    const col = (prefix:string) => head.findIndex(c=>c.startsWith(prefix));
    const levels = head.map((name,i)=>({name,i,key:'level'+name.slice(0,2)})).filter(l=>/^\d{2} /.test(l.name));
    board.parts = Object.fromEntries(levels.map(l=>[l.key,{name:l.name,group:'Stage 0'}]));
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(1)) {
      const score=num(r[col('pass@1')]?.text), total=num(r[col('Total cost')]?.text);
      if (score===undefined) continue;
      const metrics:Record<string,number>={passAt3:num(r[col('pass@3')]?.text)!, turns:num(r[col('Turns')]?.text)!, totalCost:total!};
      const tokenCell = r[col('Output tokens')]?.text;
      const n = num(tokenCell);
      if (n!==undefined) metrics.reportedOutputTokens=n*(/M/i.test(tokenCell)?1e6:/k/i.test(tokenCell)?1e3:1);
      const times:number[]=[], output:number[]=[], steps:number[]=[];
      for (const level of levels) {
        const tip=r[level.i]?.attrs['data-tip'];
        if (!tip) continue;
        const attempts: string[][] = JSON.parse(text(tip)).rows.map((a:{cells:string[]})=>a.cells);
        if (!attempts.length) continue;
        metrics[level.key]=100*attempts.filter(a=>a[0]==='solved').length/attempts.length;
        for (const [,duration,count,,tokens] of attempts) {
          if (/^[\d.]+[ms]$/.test(duration)) times.push(parseFloat(duration)*(duration.endsWith('m')?60:1));
          if (/^[\d.]+[kM]?$/.test(tokens)) output.push(parseFloat(tokens)*(/k$/.test(tokens)?1000:/M$/.test(tokens)?1e6:1));
          if (/^\d+$/.test(count)) steps.push(Number(count));
        }
      }
      const avg=(values:number[])=>values.length===24 ? values.reduce((s,v)=>s+v,0)/24 : undefined;
      const latency=avg(times), meanSteps=avg(steps);
      if(latency!==undefined) metrics.latency=latency;
      if(meanSteps!==undefined) metrics.steps=meanSteps;
      rows.push({model:r[0].text.replace(/^(OpenAI|Google|Anthropic|DeepSeek|Alibaba|Moonshot|Zhipu|MiniMax|xAI|Z\.ai|Kimi|Grok|Qwen|Hunyuan|Meta)\s+/i,""),
        score,setting:"Stage 0; 8 levels; 3 attempts",harness:"Terminus-2",trials:3,cost:total===undefined?undefined:total/24,tokens:avg(output),metrics});
    }
    if (!rows.length) throw new Error("No babaisbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

