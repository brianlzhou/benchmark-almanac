// VLADBench: Tables 3 and 4 publish the whole-benchmark Total, in percent.
// Aspect scores remain metrics. The paper defines the model abbreviations. The authors baseline stays separately named.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2503.21505";
const board: Leaderboard = {
 benchmark: "vladbench",
 url: "https://arxiv.org/html/2503.21505",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=tables(await fetchText(FEED)).map(grid);
 const a=ts.find(t=>t[0]?.includes('IXC2.5')&&t.some(r=>r[0]==='Total'));const b=ts.find(t=>t[0]?.[0]==='Aspects'&&t.some(r=>r[0]==='Total'));if(!a||!b)throw new Error('VLADBench totals missing');
 const names:Record<string,string>={'IXC2.5':'InternLM-XComposer2.5','CV':'CogVLM2','LoV':'LongVILA','QW':'Qwen-VL','IVL2':'InternVL2','MCV':'MiniCPM-V-2.6','QW2':'Qwen2-VL','OV':'LLaVA-OneVision','QW2.5':'Qwen2.5-VL','LV':'LLaVA-Video','VU':'VILA-U','Senna':'Senna','Dols':'Dolphins','DriLM':'DriveLM','DriMM':'DriveMM','DriLM-B':'DriveLM BDD','Ours':'VLADBench authors baseline'};
 const rows:LeaderboardRow[]=[];
 for(const [t,start] of [[a,2],[b,1]] as const){const total=t.find(r=>r[0]==='Total')!;for(let c=start;c<t[0].length;c++){const raw=t[0][c],size=t[1][c].replace(/\s/g,'');let model=raw==='GEM'?'Gemini 1.5 Pro (snapshot unspecified)':raw==='GPT'?'GPT-4o (snapshot unspecified)':names[raw]+'-'+size;if(model.startsWith('undefined'))throw new Error('Unknown VLADBench model '+raw);rows.push({model,score:num(total[c])!,metrics:Object.fromEntries(t.slice(2).filter(r=>r!==total).map((r,i)=>['aspect'+(i+1),num(r[c])!]))});}}
 return checked(rows,25);
 },
};
export default board;
