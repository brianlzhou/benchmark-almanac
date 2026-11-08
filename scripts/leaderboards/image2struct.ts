// Image2Struct on HELM (Stanford CRFM). The newest run suite's core_scenarios.json leads with the "Compilation
// Rate and Earth Mover Similarity" table, whose "Mean win rate" (relative to the models on the board, times
// 100) is the score. Read through helmRows in helm-capabilities.ts.
import {fetchJson} from '../lib/util.ts';
import type { Leaderboard } from './types.ts';
import { HELM_ALIASES, HELM_TERMS, helmFeed, helmRows, helmNewest, type HelmTable } from './helm-capabilities.ts';

const TABLE: HelmTable = { project: 'image2struct', kind: 'runs', group: 'core_scenarios', column: 'Mean win rate', scale: 100 };

const board: Leaderboard = {
  benchmark: 'image2struct',
  url: 'https://crfm.stanford.edu/helm/image2struct/latest/',
  feed: helmFeed(TABLE),
  terms: HELM_TERMS,
  aliases: HELM_ALIASES,
  async fetch(){
 const rows=await helmRows(TABLE);const latest=await helmNewest('image2struct','runs');const ts=await fetchJson<any[]>('https://storage.googleapis.com/crfm-helm-public/'+latest+'groups/core_scenarios.json');
 const scored=ts[0].rows.filter((r:any[])=>typeof r[1]?.value==='number');const info=ts.find(t=>t.title==='General information');
 return rows.map((r,i)=>{const raw=info?.rows.find((v:any[])=>v[0].value===scored[i][0].value);if(!raw)return r;const metrics:Record<string,number>={...r.metrics};let total=0,n=0;
 for(let j=0;j<info.header.length;j++){const h=info.header[j].value,v=raw[j]?.value;if(/# (prompt|output) tokens$/.test(h)&&typeof v==='number')metrics[h]=v;if(h.endsWith('# output tokens')&&typeof v==='number'){const count=raw[info.header.findIndex((x:any)=>x.value===h.replace('# output tokens','# eval'))]?.value;if(typeof count==='number'){total+=v*count;n+=count;}}}
 return {...r,metrics,...(n?{tokens:total/n}:{})};});
 },
};
export default board;
