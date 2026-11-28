import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
const feed='https://raw.githubusercontent.com/SinatrasC/pmpp-hard/HEAD/README.md';
export default {
  benchmark:'pmpp-hard',harnesses:'system',url:'https://github.com/SinatrasC/pmpp-hard',feed,
  stats:{passed:{name:'Tests passed',unit:'count'},cudaCutlassPassed:{name:'CUDA CUTLASS tests passed',unit:'count'},tritonPassed:{name:'Triton tests passed',unit:'count'}},
  terms:'The PMPP Hard repository is MIT licensed. The raw README path is permitted by robots.txt.',
  async fetch():Promise<LeaderboardRow[]> {
    const t=markdownTables(await fetchText(feed)).find(t=>t[0].join('|')==='Model|Passed|Score|CUDA + CUTLASS|Triton|Harness, reasoning, and timeout');
    if(!t)throw new Error('PMPP Hard results columns changed');
    const rows=t.slice(1).map(r=>{
      const [harness,...settings]=r[5].split(', ');
      const count=(s:string)=>Number(s.split('/')[0]);
      return {model:r[0],score:Number(r[2]),harness,setting:settings.join('; '),metrics:{passed:count(r[1]),cudaCutlassPassed:count(r[3]),tritonPassed:count(r[4])}};
    });
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('PMPP Hard model scores missing');
    return rows;
  },
} satisfies Leaderboard;
