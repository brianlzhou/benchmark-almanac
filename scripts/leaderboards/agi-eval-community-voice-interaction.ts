// AGI-Eval Community Voice Interaction ranks voice assistants by a combined board score.
// The headline is the board's combined score, with five conversation dimensions in metrics.
// This importer reads the ranking API for the current month selected by the public leaderboard.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const PAGE = 'https://agi-eval.org/topRanking?modality=MULTIMODAL_MODEL&modelType=VOICE_INTERACTION&rankType=PRIVATE';
const FEED = 'https://agi-eval.org/commWebApi/model/rank/dataList';
const TOP = 'https://agi-eval.org/commWebApi/model/rank/top';
const MONTHS = 'https://agi-eval.org/commWebApi/model/rank/listDate';
const parts = {
  entertainment: { name: 'Entertainment', group: 'Dimension' }, empathy: { name: 'Empathy and situation understanding', group: 'Dimension' },
  learning: { name: 'Learning and self improvement', group: 'Dimension' }, fluency: { name: 'Natural fluency', group: 'Dimension' }, problemSolving: { name: 'Problem solving', group: 'Dimension' },
};
interface Dates { rescode:number; data?:{rankDateList?:string[]} }
interface Top { rescode:number; data?:{modelRankList?:Array<{name?:string;score?:number}>} }
interface Detail { rescode:number; data?:{modelRankList?:Array<{name?:string;evalTime?:string;openStatus?:number;projectList?:Array<{project?:string;score?:string}>}>} }
const board: Leaderboard = {
  benchmark: 'agi-eval-community-voice-interaction', url: PAGE,
  feed: `${FEED} and ${TOP} (POST with the current month, VOICE_INTERACTION, PRIVATE)`,
  terms: 'AGI-Eval publishes the ranking API and page. The site gives no separate score reuse license. Results are credited to AGI-Eval (Meituan).', parts,
  async fetch(): Promise<LeaderboardRow[]> {
    const args = { modality:'MULTIMODAL_MODEL', modelType:'VOICE_INTERACTION', rankType:'PRIVATE' };
    const dates = await fetchJson<Dates>(MONTHS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)});
    const rankMonth=dates.data?.rankDateList?.[0]; if(dates.rescode!==0||!rankMonth) throw new Error('AGI-Eval VOICE_INTERACTION: ranking month missing');
    const body={...args,rankMonth,limit:500,sortProject:'综合得分',sortOrder:'asc'};
    const [top,detail]=await Promise.all([
      fetchJson<Top>(TOP,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
      fetchJson<Detail>(FEED,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
    ]);
    const tops=top.data?.modelRankList??[], rows=detail.data?.modelRankList??[]; if(top.rescode!==0||detail.rescode!==0||rows.length<8||tops.length!==rows.length) throw new Error(`AGI-Eval VOICE_INTERACTION: ${rows.length} rows, expected 8`);
    const scoreByName=new Map(tops.map(x=>[x.name,Number(x.score)]));
    const projects:Record<string,string>={ '休闲娱乐':'entertainment','共情与情景理解':'empathy','学习与自我提升':'learning','自然流畅度':'fluency','问题解决':'problemSolving' };
    return rows.map(x=>{ if(!x.name||!x.projectList) throw new Error('AGI-Eval VOICE_INTERACTION: row missing name or scores'); const score=scoreByName.get(x.name); if(score===undefined||!Number.isFinite(score)) throw new Error(`AGI-Eval VOICE_INTERACTION: ${x.name} missing headline score`); const metrics:Record<string,number>={}; for(const p of x.projectList){const k=projects[p.project??''];const v=Number(p.score);if(k&&Number.isFinite(v))metrics[k]=v;} if(Object.keys(metrics).length!==5) throw new Error(`AGI-Eval VOICE_INTERACTION: ${x.name} missing dimension scores`); return {model:x.name,score,date:x.evalTime,...(x.openStatus!==undefined?{open:x.openStatus===1}:{}),metrics}; });
  },
};
export default board;
