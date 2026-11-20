// Official Table 1 accuracy, in percent. Preserve reasoning configurations and component metrics.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://kmetbench.github.io/data/leaderboard_table_1_source.json';
const board:Leaderboard={benchmark:'k-metbench', parts: {
  korean_pct: { name: 'Korean specific', group: 'Split' },
  text_pct: { name: 'Text', group: 'Modality' },
  text_only_pct: { name: 'Text only', group: 'Modality' },
  multimodal_pct: { name: 'Multimodal', group: 'Modality' },
  part1_pct: { name: 'Weather analysis and forecast theory', group: 'Domain' },
  part2_pct: { name: 'Meteorological observation methods', group: 'Domain' },
  part3_pct: { name: 'Atmospheric dynamics', group: 'Domain' },
  part4_pct: { name: 'Climatology', group: 'Domain' },
  part5_pct: { name: 'Atmospheric physics', group: 'Domain' },
},url:'https://kmetbench.github.io/',feed:FEED,
 terms:'MIT project; the project site has no robots.txt.',
 async fetch(){
  const d=await fetchJson<{rows:({display_model_name:string;accuracy_pct:number;timestamps:Record<string,string>} & Record<string,unknown>)[]}>(FEED);
  const rows=d.rows.filter(r=>Number.isFinite(r.accuracy_pct)).map(r=>({model:r.display_model_name,score:r.accuracy_pct,date:r.timestamps?.explicit_advanced?.slice(0,10),metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>k!=='accuracy_pct'&&k.endsWith('_pct')&&typeof v==='number')) as Record<string,number>}));
  if(rows.length<3)throw new Error('No accuracy rows');return rows;
 }};export default board;
