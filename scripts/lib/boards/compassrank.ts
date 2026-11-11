// Read the public month index used by the site's own UI, then its published CDN table.
import {fetchJson} from '../util.ts';
import type {Leaderboard,LeaderboardRow} from '../../leaderboards/types.ts';
const API='https://rank.opencompass.org.cn/gw/opencompass-be/api/v1/rank/listRankTableAvailableMonths';
export function compassBoard(benchmark:string,benchmarkType:0|1):Leaderboard {
 return {benchmark,url:'https://rank.opencompass.org.cn/leaderboard-llm',feed:API+' (current '+(benchmarkType?'CompassBench':'CompassAcademic')+' month and CDN data)',
 terms:'OpenCompass robots restrictions include leaderboard data paths. The Almanac credits OpenCompass and links the source.',
 async fetch(){const months=await fetchJson<any>(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rankingType:0,benchmarkType})});
 const latest=months.data?.[0];if(!latest?.fileName?.startsWith('assets/'))throw new Error('CompassRank month feed changed');
 const d=await fetchJson<any>('https://cdn.opencompass.org.cn/'+latest.fileName);
 const rows:LeaderboardRow[]=[];
 for(const r of d.OverallTable??[]){const score=r.Average;if(!Number.isFinite(score)||!r.model)continue;
 const metrics:Record<string,number>={};for(const [k,v] of Object.entries(r))if(k!=='key'&&k!=='Average'&&typeof v==='number')metrics[k]=v;
 for(const key of ['KnowledgeTable','ReasonTable','MathTable','CodeTable'])for(const sub of d[key]??[])if(sub.model===r.model)for(const [k,v] of Object.entries(sub))if(k!=='key'&&k!=='Average'&&typeof v==='number')metrics[k]=v;
 rows.push({model:r.model,score,setting:`Source edition ${latest.month}`,metrics});}
 if(!rows.length)throw new Error('CompassRank scored rows missing');return rows;
 }};
}
