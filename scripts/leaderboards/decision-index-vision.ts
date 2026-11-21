// Read the full index, public and private benchmark scores, calibration, image budgets, speed and model sizes.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/vision.json';
const board:Leaderboard={benchmark:'decision-index-vision', parts: {
  public: { name: 'Public', group: 'Split' },
  private: { name: 'Private', group: 'Split' },
}, stats: {
 latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
 calibrationAcc: { name: 'Calibration accuracy', unit: 'score', better: 'higher', note: 'Accuracy across the calibration examples, stored from 0 to 1.' },
 calibrationConf: { name: 'Mean calibration confidence', unit: 'score', better: 'higher', note: 'Mean confidence across the calibration examples, stored from 0 to 1.' },
 calibrationEce: { name: 'Expected calibration error', unit: 'score', better: 'lower', note: 'Calibration error, stored from 0 to 1.' },
 calibrationOver95: { name: 'Confidence over 95 percent', unit: 'score', better: 'lower', note: 'Share of examples with confidence above 95 percent, stored from 0 to 1.' },
 calibrationN: { name: 'Calibration examples', unit: 'count' },
 calibrationBenchmarks: { name: 'Calibration benchmarks', unit: 'count' },
 cVBenchPublic: { name: 'CV-Bench public score', unit: '%', better: 'higher' }, cVBenchPrivate: { name: 'CV-Bench private score', unit: '%', better: 'higher' },
 bLINKPublic: { name: 'BLINK public score', unit: '%', better: 'higher' }, bLINKPrivate: { name: 'BLINK private score', unit: '%', better: 'higher' },
 realWorldQAPublic: { name: 'RealWorldQA public score', unit: '%', better: 'higher' }, realWorldQAPrivate: { name: 'RealWorldQA private score', unit: '%', better: 'higher' },
 charXivPublic: { name: 'CharXiv public score', unit: '%', better: 'higher' }, charXivPrivate: { name: 'CharXiv private score', unit: '%', better: 'higher' },
 infographicVQAPublic: { name: 'InfographicVQA public score', unit: '%', better: 'higher' }, infographicVQAPrivate: { name: 'InfographicVQA private score', unit: '%', better: 'higher' },
 mind2WebPublic: { name: 'Mind2Web public score', unit: '%', better: 'higher' }, mind2WebPrivate: { name: 'Mind2Web private score', unit: '%', better: 'higher' },
 winogroundPublic: { name: 'Winoground public score', unit: '%', better: 'higher' }, winogroundPrivate: { name: 'Winoground private score', unit: '%', better: 'higher' },
 kIECORDFUNSDPublic: { name: 'KIE CORD and FUNSD public score', unit: '%', better: 'higher' }, kIECORDFUNSDPrivate: { name: 'KIE CORD and FUNSD private score', unit: '%', better: 'higher' },
 moderationHatefulMemesPublic: { name: 'Moderation Hateful Memes public score', unit: '%', better: 'higher' }, moderationHatefulMemesPrivate: { name: 'Moderation Hateful Memes private score', unit: '%', better: 'higher' },
 rBenchMPublic: { name: 'R-Bench-M public score', unit: '%', better: 'higher' }, mMMUProVisionPublic: { name: 'MMMU-Pro vision public score', unit: '%', better: 'higher' },
 activeParams: { name: 'Active parameters', unit: 'billions' }, gpuHours: { name: 'GPU hours', unit: 'hours', better: 'lower' }, maxPixels: { name: 'Maximum image pixels', unit: 'count' }, publicRank: { name: 'Public rank', unit: 'count', better: 'lower' },
 nativePublic: { name: 'Native public score', unit: '%', better: 'higher' }, nativePrivate: { name: 'Native private score', unit: '%', better: 'higher' }, nativeFull: { name: 'Native full score', unit: '%', better: 'higher' },
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
