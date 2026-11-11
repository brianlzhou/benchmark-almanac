// LifeSci-Diamond strict full-set pass rate, with generation USD per task.
// Retains system scaffolds and graded-task coverage; mean graded quality is a separate metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/arcainc/lifesci-diamond/main/README.md";
const board: Leaderboard = {
 benchmark: "lifesci-diamond", url: "https://github.com/arcainc/lifesci-diamond", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('Strict pass on full set'));if(!t)throw new Error('Missing LifeSci table');const rows:LeaderboardRow[]=[];
for(const r of t.rows){const score=num(r[2]);if(score===undefined)continue;let model=r[0],harness:string|undefined;
if(model.startsWith('Arca + ')){model=model.slice(7);harness='Arca';if(model==='Auto')model='Arca Auto [system]';}
else if(model.endsWith(' API')){model=model.slice(0,-4);harness='API';}
const counts=r[1].match(/(\d+)\s*\/\s*(\d+)/);const mean=num(r[3]);const metrics:Record<string,number>={};if(counts){metrics.graded=Number(counts[1]);metrics.tasks=Number(counts[2]);}if(mean!==undefined)metrics.meanGraded=mean;
rows.push({model,score,harness,cost:num(r[4]),metrics});}return rows;
 },
};
export default board;
