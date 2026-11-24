// Read the full index, public and private benchmark scores, calibration, speed and model sizes.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/vision.json';
const board:Leaderboard={benchmark:'decision-index-vision', parts: {
  public: { name: 'Public', group: 'Split' },
  private: { name: 'Private', group: 'Split' },
  cVBenchPublic: { name: 'CV-Bench', group: 'Public benchmarks' },
  cVBenchPrivate: { name: 'CV-Bench', group: 'Private benchmarks' },
  bLINKPublic: { name: 'BLINK', group: 'Public benchmarks' },
  bLINKPrivate: { name: 'BLINK', group: 'Private benchmarks' },
  realWorldQAPublic: { name: 'RealWorldQA', group: 'Public benchmarks' },
  realWorldQAPrivate: { name: 'RealWorldQA', group: 'Private benchmarks' },
  charXivPublic: { name: 'CharXiv', group: 'Public benchmarks' },
  charXivPrivate: { name: 'CharXiv', group: 'Private benchmarks' },
  infographicVQAPublic: { name: 'InfographicVQA', group: 'Public benchmarks' },
  infographicVQAPrivate: { name: 'InfographicVQA', group: 'Private benchmarks' },
  mind2WebPublic: { name: 'Mind2Web', group: 'Public benchmarks' },
  mind2WebPrivate: { name: 'Mind2Web', group: 'Private benchmarks' },
  winogroundPublic: { name: 'Winoground', group: 'Public benchmarks' },
  winogroundPrivate: { name: 'Winoground', group: 'Private benchmarks' },
  kIECORDFUNSDPublic: { name: 'KIE (CORD / FUNSD)', group: 'Public benchmarks' },
  kIECORDFUNSDPrivate: { name: 'KIE (CORD / FUNSD)', group: 'Private benchmarks' },
  moderationHatefulMemesPublic: { name: 'Moderation (Hateful Memes)', group: 'Public benchmarks' },
  moderationHatefulMemesPrivate: { name: 'Moderation (Hateful Memes)', group: 'Private benchmarks' },
  rBenchMPublic: { name: 'R-Bench-M', group: 'Public benchmarks' },
  mMMUProVisionPublic: { name: 'MMMU-Pro (Vision)', group: 'Public benchmarks' },
}, stats: {
 latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
 calibrationAcc: { name: 'Calibration accuracy', unit: 'score', better: 'higher', note: 'Accuracy across the calibration examples, stored from 0 to 1.' },
 calibrationConf: { name: 'Mean calibration confidence', unit: 'score', better: 'higher', note: 'Mean confidence across the calibration examples, stored from 0 to 1.' },
 calibrationEce: { name: 'Expected calibration error', unit: 'score', better: 'lower', note: 'Calibration error, stored from 0 to 1.' },
 calibrationOver95: { name: 'Confidence over 95 percent', unit: 'score', better: 'lower', note: 'Share of examples with confidence above 95 percent, stored from 0 to 1.' },
 calibrationN: { name: 'Calibration examples', unit: 'count' },
 activeParams: { name: 'Active parameters', unit: 'billions' }, gpuHours: { name: 'GPU hours', unit: 'hours', better: 'lower' },
 nativePublic: { name: 'Native public score', unit: '%', better: 'higher' }, nativePrivate: { name: 'Native private score', unit: '%', better: 'higher' }, nativeFull: { name: 'Native full score', unit: '%', better: 'higher' },
},url:'https://huggingface.co/spaces/multimodalart/jev-decision-index',feed:FEED,terms:'Public author data mirrored under CC BY 4.0. The Almanac credits and links the source.',async fetch(){
 const d=await fetchJson<any>(FEED);
 return [...d.entrants,...d.refs].filter(r=>typeof r.full==='number').map(r=>{
   const metrics:Record<string,number>={public:r.pub,private:r.priv};
   if (typeof r.ms_row==='number') metrics.latency=r.ms_row/1000;
   const active=typeof r.active==='string' && r.active.match(/^A([\d.]+)B$/i);
   if (active) metrics.activeParams=Number(active[1]);
   for(const [k,v] of Object.entries({gpuHours:r.gpu_h,
     nativePublic:r.native?.pub,nativePrivate:r.native?.priv,nativeFull:r.native?.full})) {
     if(typeof v==='number') metrics[k]=v;
   }
   for(const [k,v] of Object.entries(r.cal ?? {})) {
     if(k !== 'benchmarks' && typeof v==='number') metrics['calibration'+k[0].toUpperCase()+k.slice(1)]=v;
   }
   for (const [name,values] of Object.entries(r.bench ?? {}) as [string,Record<string,unknown>][]) {
     const key=name.replace(/[^A-Za-z0-9]+([A-Za-z0-9])?/g,(_,c:string)=>c?.toUpperCase() ?? '').replace(/^./,c=>c.toLowerCase());
     for (const [field,label] of [['pub','Public'],['private','Private']]) {
       const value=values[field];
       if(typeof value==='number') {
         metrics[key+label]=value;
       }
     }
   }
   return {model:r.name,score:r.full,setting:r.ref?'Stock reference':r.kind, metrics,
     params:typeof r.params==='number'?r.params/1e9:undefined,link:typeof r.url==='string'&&/^https?:\/\/\S+$/.test(r.url)?r.url:undefined,
     submitter:r.ref ? undefined : r.org?.name};
 });
}};export default board;
