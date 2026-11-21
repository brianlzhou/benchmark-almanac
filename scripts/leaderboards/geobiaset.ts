// GeoBiaset tests how foreground edits affect image geolocation. The project site's results chart
// and larger-model table report accuracy within 2,500 km on original and edited images.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url='https://miccunifi.github.io/GeoBiaset/';
const board:Leaderboard={
  benchmark:'geobiaset',url,feed:url,terms:'The authors publish these results at '+url,
  aliases:{'InternVL3.5':'internvl3-5-8b','Qwen3-VL':'qwen3-vl-8b-instruct','Gemma3-27B-IT':'gemma-3-27b'},
  headline:'The headline is continent-level accuracy on the 9,212 edited images. The original backgrounds provide the comparison.',
  parts:{original:'Original accuracy',attack:{name:'POPI-A',better:'lower'},help:'POPI-H',distraction:{name:'POPI-D',better:'lower'}},
  async fetch(){
    const html=await fetchText(url);
    const path=html.match(/<script[^>]*\bsrc="([^"]*\/content\.js)"/)?.[1];
    if(!path) throw new Error('Missing GeoBiaset results script');
    await new Promise(resolve=>setTimeout(resolve,1050));
    const js=await fetchText(new URL(path,url).href);
    const block=js.match(/\bresults:\s*\[([\s\S]*?)\]/)?.[1];
    const extra=tables(html).find(t=>t[0]?.map(c=>c.text).join('|')==='Model|Original|Edited|POPI-A|POPI-H|POPI-D');
    if(!block || !extra) throw new Error('Missing GeoBiaset model results');
    const data=Array.from(block.matchAll(/\{([^{}]+)\}/g),([,obj])=>{
      const model=obj.match(/\bmodel:\s*'([^']+)'/)?.[1];
      if(!model) throw new Error('Missing model name');
      return [model,...['original','edited','attack','help','distraction'].map(k=>obj.match(new RegExp('\\b'+k+':\\s*([\\d.]+)'))?.[1]??'')];
    });
    data.push(...extra.slice(1).map(row=>row.map(c=>c.text)));
    const rows=data.map(([model,...cells])=>{
      if(cells.length!==5 || cells.some(v=>!/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid result for '+model);
      const [original,score,attack,help,distraction]=cells.map(Number);
      return {model,score,metrics:{original,attack,help,distraction}};
    });
    return checked(rows,10);
  },
};
export default board;
