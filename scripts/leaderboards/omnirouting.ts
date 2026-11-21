// OmniRouting ranks PCB routing configurations by net routing rate (NRR). The project page loads one-shot and agent results from two scripts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.omnieda.com/routing/tables.js";


const board: Leaderboard = {
  benchmark: "omnirouting",
  url: "https://www.omnieda.com/routing/#leaderboard",
  feed,
  terms: "The results page gives no score reuse license. https://www.omnieda.com/routing/ The site allows crawling.",
  stats: {
    NRR: { name: 'Net routability rate', unit: '%', better: 'higher' },
    PRR: { name: 'Pad-pair routability rate', unit: '%', better: 'higher' },
    Open: { name: 'Open nets', unit: '%', better: 'lower' },
    PShort: { name: 'Pad short nets', unit: '%', better: 'lower' },
    NShort: { name: 'Net short nets', unit: '%', better: 'lower' },
    Total: { name: 'Total violations', unit: 'count', better: 'lower' },
    'Clr.': { name: 'Clearance violations', unit: 'count', better: 'lower' },
    'Dist.': { name: 'Distance violations', unit: 'count', better: 'lower' },
    Polygon: { name: 'Polygon outputs', unit: '%', better: 'higher', note: 'Outputs with a copper pour.' },
    TWL: { name: 'Routed-wire centerline length', unit: 'score', better: 'lower' },
    '#Vias': { name: 'Vias', unit: 'count' },
    '#Layers': { name: 'Routing layers', unit: 'count' },
    PR: { name: 'Pass rate', unit: 'score', better: 'higher', note: 'Fraction of expected inputs producing valid output.' },
    RT: { name: 'Runtime', unit: 'seconds', better: 'lower' },
    steps: { name: 'Steps', unit: 'count' },
  },
  async fetch() {
    const one = await fetchText(feed);
    await new Promise(resolve=>setTimeout(resolve,1000));
    const agent = await fetchText(new URL('app.js',feed).href);
    const rows:LeaderboardRow[] = [];
    const columns = ['NRR','PRR','Open','PShort','NShort','Total','Clr.','Dist.','Polygon','TWL','#Vias','#Layers','PR','RT','steps'];
    function add(model:string,setting:string,harness:string,values:(string|null)[]) {
      if(values.every(v=>v===null)) return;
      if(!model || !setting || values.length !== (harness==='One-shot'?14:15) || values[0] === null) throw new Error('Invalid routing configuration');
      const metrics:Record<string,number>={};
      values.forEach((v,i)=>{ if(v!==null) { if(!Number.isFinite(Number(v))) throw new Error('Invalid routing metric'); metrics[columns[i]]=Number(v); } });
      rows.push({model,setting,harness,score:metrics.NRR,metrics});
    }
    for(const m of one.matchAll(/label: "([^"]+)", size: "[^"]+", type: "[^"]+", rows: \[([\s\S]*?)\n\s*\],\s*\}/g)) {
      for(const r of m[2].matchAll(/\["([^"]+)", (\[[^\]]+\])\]/g)) add(m[1],r[1],'One-shot',JSON.parse(r[2]));
    }
    const names = new Map([...agent.matchAll(/id: "([^"]+)",\s*label: "([^"]+)"/g)].map(m=>[m[1],m[2]]));
    const results = agent.split('const results = {')[1]?.split('};')[0];
    if (!results) throw new Error('Missing agent routing results');
    for(const group of results.matchAll(/(exp\d+): \{([^}]+)\}/g)){
      for(const r of group[2].matchAll(/"([^"]+)": (\[[^\]]+\])/g)) add(names.get(r[1])!,names.get(group[1])!,'Agent',JSON.parse(r[2]));
    }
    if(rows.length < 91) throw new Error('Incomplete routing standings');
    return rows;
  },
};
export default board;
