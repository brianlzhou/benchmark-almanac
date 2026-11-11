// BenchCAD Core publishes version-specific HTML tables. Retain hidden rows and estimated costs.
// Never put the custom-harness row explicitly marked "2.0 scorer" on the 2.1 board.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num, text } from '../html.ts';
const url='https://benchcad.com/leaderboard.html';
export function benchcadCore(version:'2.0'|'2.1'):Leaderboard {
 return {benchmark:`benchcad-${version.replace('.','-')}`,url,feed:`${url} (BenchCAD ${version} Core tables)`,
  terms:'BenchCAD publishes these public tables, including credited vendor results; the Almanac credits BenchCAD and links its source.',
  async fetch():Promise<LeaderboardRow[]> {
   const html=await fetchText(url);const rows:LeaderboardRow[]=[];
   const sections=version==='2.1'
    ? [{body:html.split('BenchCAD 2.1 Core')[1]?.split('BenchCAD 2.0 Core')[0],mode:'2.1'}]
    : [{body:html.split('BenchCAD 2.0 Core')[1]?.split('Vision2Code')[0],mode:'2.0'}, {body:html.split('BenchCAD 2.1 Core')[1]?.split('BenchCAD 2.0 Core')[0],mode:'legacy-custom'}];
   for(const section of sections){
    if(!section.body)throw new Error('BenchCAD Core heading changed');
    // Remove the credit sublabel before extracting model names; preserve its scorer flag first.
    for(const table of section.body.match(/<table\b[\s\S]*?<\/table>/g)??[]){
     const header=tables(table)[0]?.[0]?.map(c=>c.text)??[];
     const isCustom=header.includes('Harness');const si=header.indexOf('Score');
     if(si<0)continue;
     for(const tr of table.match(/<tr\b[\s\S]*?<\/tr>/g)??[]){
      const legacy=/2\.0 scorer/.test(tr);
      if(section.mode==='legacy-custom'?!legacy:version==='2.1'&&legacy)continue;
      const r=tables(`<table>${tr.replace(/<small\b[\s\S]*?<\/small>/g,'')}</table>`)[0]?.[0]?.map(c=>c.text);
      if(!r||!/^\d+$/.test(r[0]))continue;
      const score=num(r[si]);if(score===undefined)continue;
      const effort=r[1].match(/\s*\((max|xhigh|high|medium|low|minimal)\)$/i);
      const model=effort?r[1].slice(0,effort.index).trim():r[1];
      const metrics:Record<string,number>={};const ci=header.indexOf('±95%'),costIndex=header.indexOf('Cost / case');
      if(ci>=0){const v=num(r[ci]);if(v!==undefined){metrics.ciLow=(score-v)*100;metrics.ciHigh=(score+v)*100;}}
      const cost=costIndex>=0?num(r[costIndex]):undefined;
      if(cost!==undefined){metrics.cost=cost;metrics.costEstimated=/≈|est\./.test(r[costIndex])?1:0;}
      if(/≈/.test(r[si]))metrics.scoreEstimated=1;
      const ti=header.indexOf('Tokens / case');if(ti>=0){const v=num(r[ti]);if(v!==undefined)metrics.totalTokensPerCase=v*(/M/i.test(r[ti])?1e6:/k/i.test(r[ti])?1e3:1);}
      const timeIndex=header.indexOf('Time / case');if(timeIndex>=0){const v=num(r[timeIndex]);if(v!==undefined)metrics.latency=v*(/\bh\b/.test(r[timeIndex])?3600:60);}
      rows.push({model,score:score*100,setting:effort?.[1],harness:isCustom?r[2]:`BenchCAD ${version}`,cost,metrics});
     }
    }
   }
   if(!rows.length)throw new Error('No BenchCAD Core rows');return rows;
  }
 };
}
