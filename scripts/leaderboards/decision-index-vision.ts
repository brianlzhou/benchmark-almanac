// Read the full index, public and private benchmark scores, calibration, image budgets, speed and model sizes.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/vision.json';
const board:Leaderboard={benchmark:'decision-index-vision', parts: {
  public: { name: 'Public', group: 'Split' },
  private: { name: 'Private', group: 'Split' },
},url:'https://huggingface.co/spaces/multimodalart/jev-decision-index',feed:FEED,terms:'Public author data mirrored under CC BY 4.0. The Almanac credits and links the source.',async fetch(){
 const d=await fetchJson<any>(FEED);
 return [...d.entrants,...d.refs].filter(r=>typeof r.full==='number').map(r=>{
   const metrics:Record<string,number>={public:r.pub,private:r.priv};
   if (typeof r.ms_row==='number') metrics.latency=r.ms_row/1000;
   if (typeof r.params_estimated==='boolean') metrics.paramsEstimated=Number(r.params_estimated);
   const active=typeof r.active==='string' && r.active.match(/^A([\d.]+)B$/i);
   if (active) metrics.activeParams=Number(active[1]);
   for(const [k,v] of Object.entries({gpuHours:r.gpu_h,maxPixels:r.effective_max_pixels,
     publicRank:r.rank_pub,nativePublic:r.native?.pub,nativePrivate:r.native?.priv,nativeFull:r.native?.full})) {
     if(typeof v==='number') metrics[k]=v;
   }
   for(const [k,v] of Object.entries(r.cal ?? {})) {
     if(typeof v==='number') metrics['calibration'+k[0].toUpperCase()+k.slice(1)]=v;
   }
   for (const [name,values] of Object.entries(r.bench ?? {}) as [string,Record<string,unknown>][]) {
     const key=name.replace(/[^A-Za-z0-9]+([A-Za-z0-9])?/g,(_,c:string)=>c?.toUpperCase() ?? '').replace(/^./,c=>c.toLowerCase());
     for (const [field,label] of [['pub','Public'],['private','Private']]) {
       const value=values[field];
       if(typeof value==='number') {
         metrics[key+label]=value;
         board.parts![key+label]={name,group:label+' benchmarks'};
       }
     }
   }
   return {model:r.name,score:r.full,setting:r.ref?'Stock reference':r.kind, metrics,
     params:typeof r.params==='number'?r.params/1e9:undefined,link:/^https?:\/\//.test(r.url)?r.url:undefined,
     submitter:r.ref ? undefined : r.org?.name};
 });
}};export default board;
