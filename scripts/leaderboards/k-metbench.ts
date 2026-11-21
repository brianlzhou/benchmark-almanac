// Official Table 1 accuracy, in percent. Keep parameter counts, explicit thinking modes and both reasoning score scales.
import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://kmetbench.github.io/data/leaderboard_table_1_source.json';
const board:Leaderboard={benchmark:'k-metbench', stats: { geo_pct: { name: 'Geography accuracy', unit: '%', better: 'higher' }, reasoning_pct: { name: 'Reasoning accuracy', unit: '%', better: 'higher' }, reasoningRubric: { name: 'Reasoning rubric score', unit: 'score', better: 'higher' } }, parts: {
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
  const rows = d.rows.filter(r => Number.isFinite(r.accuracy_pct)).map(r => {
    const mode = r.display_model_name.match(/ \((Thinking|Non-Thinking)\)$/);
    const metrics = Object.fromEntries(Object.entries(r).filter(([key, value]) =>
      key !== 'accuracy_pct' && key.endsWith('_pct') && typeof value === 'number')) as Record<string, number>;
    if (typeof r.reasoning_4_20 === 'number') metrics.reasoningRubric = r.reasoning_4_20;
    return {
      model: mode ? r.display_model_name.slice(0, mode.index) : r.display_model_name,
      setting: mode?.[1].toLowerCase(), score: r.accuracy_pct, metrics,
      date: r.timestamps?.explicit_advanced?.slice(0, 10),
      params: typeof r.model_size_b === 'number' ? r.model_size_b : undefined,
      open: r.is_proprietary_model === true ? false : undefined,
    };
  });
  if(rows.length<3)throw new Error('No accuracy rows');return rows;
 }};export default board;
