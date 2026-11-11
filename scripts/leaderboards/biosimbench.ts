// Source defines Overall as the unweighted mean of four response-prediction tracks.
// Research-agent episode reward is a separate task, never mixed into this mean.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const URL='https://www.celltype.com/biosimbench';
interface Model {id:string;name:string;detail:string;group:string;regime:string;scores:Record<string,{v:number;ci?:number[]}>;legacy?:boolean;placeholder?:boolean}
const board:Leaderboard={benchmark:'biosimbench',url:URL,feed:URL+' (app bundle response-prediction data)',
 terms:'CellType terms prohibit automated access and systematic collection; the Almanac credits CellType and links the source.',
 async fetch(){const html=await fetchText(URL);const src=html.match(/src="([^" ]*\/assets\/app-[^" ]+\.js)"/)?.[1];
 if(!src)throw new Error('BioSimBench app bundle missing');const js=await fetchText(new globalThis.URL(src,URL).href);
 const marker=js.indexOf('[{id:"q27-e7"');if(marker<0)throw new Error('BioSimBench source array changed');
 const data=jsLiteral<Model[]>(js.slice(marker).replace(/([[:,])\.(\d)/g,'$10.$2').replace(/!0/g,'true').replace(/!1/g,'false'),0);
 const keys=['drugTransfer','crispri','drugResponse','cytokine'];
 const rows=data.filter(r=>r.regime==='knowledge'&&['frontier','ours'].includes(r.group)&&!r.placeholder&&keys.every(k=>Number.isFinite(r.scores[k]?.v))).map(r=>({model:r.name,setting:r.detail,score:keys.reduce((sum,k)=>sum+r.scores[k].v,0)/keys.length,metrics:Object.fromEntries(keys.flatMap(k=>[[k,r.scores[k].v],...(r.scores[k].ci?[[k+'CiLow',r.scores[k].ci![0]],[k+'CiHigh',r.scores[k].ci![1]]]:[])]))}));
 if(!rows.length)throw new Error('No complete BioSimBench prediction results');return rows;}};
export default board;
