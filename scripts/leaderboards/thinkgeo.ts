// Axis Spatial ranks ThinkGeo agents by the percentage of its verifiable satellite-image tasks passed. The page includes cost and resource tables for the same configurations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables,num } from '../lib/html.ts';
import index from './spatial-agent-index-2.ts';

const feed = "https://www.axisspatial.com/arena/evaluations/thinkgeo";


const board: Leaderboard = {
  benchmark: "thinkgeo",
  url: "https://www.axisspatial.com/arena/evaluations/thinkgeo",
  feed,
  terms: "The agent can use code. Axis Spatial restricts the tasks to outputs its checks can verify. Axis Spatial permits reuse of scores and charts with credit and a link to the source page. https://www.axisspatial.com/arena/methodology/data-policy The public evaluation page is allowed in robots.txt.",
  host:'Axis Spatial',aliases:index.aliases,
  stats: { uncachedInput:{name:'Uncached input tokens',unit:'tokens'}, cachedInput:{name:'Cached input tokens',unit:'tokens'}, output:{name:'Output tokens',unit:'tokens'}, totalTokens:{name:'Total tokens',unit:'tokens'}, uncachedInputCost:{name:'Uncached input cost',unit:'usd',better:'lower'}, cachedInputCost:{name:'Cached input cost',unit:'usd',better:'lower'}, outputCost:{name:'Output cost',unit:'usd',better:'lower'}, unsplitCost:{name:'Unsplit cost',unit:'usd',better:'lower'}, normalizedTimeSeconds:{name:'Normalized time',unit:'seconds',better:'lower'} },
  async fetch(){
    const all=tables(await fetchText(feed));
    const byColumn=(col:string)=>new Map(all.filter(t=>t[0].some(c=>c.text===col)).flatMap(t=>t.slice(1).map(r=>[r[0].text,r] as const)));
    const ranked=byColumn('Entry'),tokens=byColumn('Output (reasoning included)'),costs=byColumn('Not split by token type');
    if(ranked.size<39) throw new Error('Incomplete ThinkGeo standings');
    return [...ranked].map(([name,r])=>{
      const m=name.match(/^(.+) \(([^()]+)\), (.+)$/),t=tokens.get(name),c=costs.get(name),score=num(r[1].text);
      if(!m || !t || !c || score===undefined) throw new Error('Incomplete configuration '+name);
      const metrics:Record<string,number>={};
      ['uncachedInput','cachedInput','output','totalTokens'].forEach((k,i)=>{
        const s=t[i+2].text,v=num(s);if(v!==undefined) metrics[k]=v*(/k$/i.test(s)?1e3:/m$/i.test(s)?1e6:1);
      });
      ['uncachedInputCost','cachedInputCost','outputCost','unsplitCost'].forEach((k,i)=>{const v=num(c[i+2].text);if(v!==undefined) metrics[k]=v;});
      const min=num(r[3].text);if(min!==undefined) metrics.normalizedTimeSeconds=min*60;
      const href=r[0].html.match(/href="([^"]+)"/)?.[1];
      return {model:m[1],setting:m[2],harness:m[3],score,cost:num(r[2].text),tokens:metrics.output,metrics,link:href?new URL(href,feed).href:undefined};
    });
  },
};
export default board;
