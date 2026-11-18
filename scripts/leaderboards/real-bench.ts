// REAL v1, all 112 tasks. Follow the maker's all-checks-pass success rule.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchJson} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://www.realevals.ai/api/getVerifiedModelData';
type Task={id:string;evalsPassed:string[]|null;evalsFailed:string[]|null};
const board:Leaderboard={benchmark:'real-bench',verified:'marked verified by REAL',url:'https://www.realevals.ai',feed:FEED,
 terms:'Public maker leaderboard API; robots.txt returns 404 and specifies no restrictions. Attribute REAL by AGI, Inc.',
 aliases:{'Sonnet-4':'claude-sonnet-4','Deepseek chat v3 0324':'deepseek-v3-mar-2025'},
 async fetch(){const d=await fetchJson<{aiModels:{name:string;verified:boolean;tag:string[]|null;websites:{tasks:Task[]}[]}[]}>(FEED);const out:LeaderboardRow[]=[];
 for(const m of d.aiModels){if(!m.verified||!m.tag?.includes('model_score'))continue;const tasks=m.websites.flatMap(w=>w.tasks).filter(t=>!t.id.startsWith('v2.'));
 if(tasks.length!==112||new Set(tasks.map(t=>t.id)).size!==112||tasks.some(t=>t.evalsPassed===null||t.evalsFailed===null))continue;
 const thinking=/:thinking/i.test(m.name);let model=m.name.replace(/:thinking/i,'');if(model==='OpenAI CUA')model+=' (backbone unspecified)';
 out.push({model,verified:m.verified,score:Number((100*tasks.filter(t=>t.evalsPassed!.length>0&&t.evalsFailed!.length===0).length/112).toFixed(1)),setting:'REAL v1; 112 tasks'+(thinking?'; thinking':'' )});
 }return checked(out,3);
 }};export default board;
