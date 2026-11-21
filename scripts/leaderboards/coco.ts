// COCO defaults to BBOX Dev (bbox_dev2015), ranked by AP averaged over IoU thresholds 0.50 through 0.95. Fractions become percentages. Segmentation and other years are separate views. Keep each team’s latest submission, its report and the COCO evaluation statistics for each object category.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://cocodataset.org/leaderboard/bbox_dev2015.json";
const board: Leaderboard = {
  benchmark: "coco",
  parts: {
    AP_small: { name: 'Small', group: 'Object size' },
    AP_medium: { name: 'Medium', group: 'Object size' },
    AP_large: { name: 'Large', group: 'Object size' },
  },
  url: "https://cocodataset.org/#detection-leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=await fetchJson<any[]>(FEED);const keep=new Map<string,LeaderboardRow>();
const measures=['','Ap50','Ap75','ApSmall','ApMedium','ApLarge','Ar1','Ar10','Ar100','ArSmall','ArMedium','ArLarge'];
for(const r of [...d].sort((a,b)=>a.date.localeCompare(b.date))){
  const m=JSON.parse(r.results);
  if(typeof m.AP!=='number') throw new Error('Missing detection AP');
  const metrics=Object.fromEntries(Object.entries(m).filter(([k,v])=>k!=='AP'&&typeof v==='number').map(([k,v])=>[k,100*(v as number)]));
  const details=r.results_details ? JSON.parse(r.results_details) : {};
  for (const [source,prefix,group] of [['per_category','category','Object category'],['per_supercategory','supercategory','Object supercategory']]) {
    for (const [name,values] of Object.entries(details?.[source] ?? {})) {
      if (!Array.isArray(values)) continue;
      const key=prefix+name.replace(/(?:^|[^a-zA-Z0-9]+)([a-zA-Z0-9])/g,(_,letter:string)=>letter.toUpperCase());
      values.slice(0,measures.length).forEach((value,i)=>{
        if (typeof value==='number' && value>=0 && value<=1) {
          metrics[key+measures[i]]=100*value;
          if (i===0) board.parts![key]={name,group};
        }
      });
    }
  }
  keep.set(r.team.name,{model:r.team.name,score:100*m.AP,date:r.date,metrics,
    submitter:r.team.members?.trim() || r.team.name, link:/^https?:\/\//.test(r.url)?r.url:undefined});
}
return [...keep.values()];

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
