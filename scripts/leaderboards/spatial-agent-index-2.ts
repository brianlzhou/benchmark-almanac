// The Spatial Agent Index v2 ranks eligible geospatial agents by the text-only index. Axis Spatial also publishes component scores, a text-plus-vision index and resource use.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "spatial-agent-index-2",
  url: "https://www.axisspatial.com/arena/agent-index",
  feed: "https://www.axisspatial.com/arena/agent-index",
  terms: "Axis Spatial permits reuse of scores and charts with credit and a link to the source page. https://www.axisspatial.com/arena/methodology/data-policy Its robots.txt allows the ranking page.",
  stats: {
    textOnly: { name: 'Text-only index', unit: 'index', better: 'higher' },
    textAndVision: { name: 'Text-and-vision index', unit: 'index', better: 'higher' },
    turns: { name: 'Turns', unit: 'count', better: 'lower' },
  },
  aliases: {
    'Nemotron 3.5 Super VL 120B':'nemotron-3-5-super-vl',
    'Nemotron 3 Nano Omni 30B':'nemotron-3-nano-omni-30b-a3b',
    'Nemotron 3.5 Lightning 30B':'nemotron-3-5-lightning-30b-a3b',
  },
  async fetch() {
    const all = tables(await fetchText(this.url));
    const find = (last:string) => all.find(t=>t[0]?.length===3 && t[0][1].text==='Developer' && t[0][2].text===last);
    const rank = find('Spatial Agent Index'), cost = find('Cost per task'), tokens = find('Output tokens per task'), turns = find('Turns');
    const split = all.find(t=>t[0]?.[1]?.text==='Earth-Bench V2' && t[0].at(-1)?.text==='Spatial Agent Index: Text + vision');
    if (!rank || rank.length<93 || !cost || !tokens || !turns || !split) throw new Error('Missing Spatial Agent Index tables');
    const parts = split[0].slice(1,5).map(c=>c.text);
    this.parts = Object.fromEntries(parts.map(p=>[p,p]));
    return rank.slice(1).map(r=>{
      const name = r[0].text;
      const match = name.match(/^(.+) \(([^()]+)\), (.+)$/);
      const row = split.find(x=>x[0].text===name);
      const resource = (t:typeof rank) => t.find(x=>x[0].text===name)?.[2].text || '';
      const count=resource(tokens);
      const score=num(r[2].text);
      if (!match || !row || score===undefined || !count) throw new Error('Missing Spatial Agent Index result for '+name);
      const metrics:Record<string,number> = {};
      for(const [i,key] of [...parts,'textOnly','textAndVision'].entries()){const v=num(row[i+1].text); if(v!==undefined) metrics[key]=v;}
      const nTurns = num(resource(turns)); if(nTurns!==undefined) metrics.turns=nTurns;
      const href=r[0].html.match(/href="([^"]+)"/)?.[1];
      return {model:match[1],setting:match[2],harness:match[3],score,cost:num(resource(cost)),tokens:num(count)===undefined?undefined:num(count)!*(count.endsWith('k')?1000:1),link:href?new URL(href,this.url).href:undefined,metrics};
    });
  },
};
export default board;
