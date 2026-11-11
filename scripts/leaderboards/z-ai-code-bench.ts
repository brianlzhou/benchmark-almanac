// Z.ai Code Bench v1.0: exact score/token values stated in the two official launch posts.
// The chart has additional image-only effort points. Do not digitize or invent those values.
// Chart caption identifies Claude Code 2.1.207; the Opus 4.8 comparison point is its Max setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const ROOT='https://z.ai';
async function post(slug:string){
 const url=ROOT+'/blog/'+slug;const html=await fetchText(url);
 const path=html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];if(!path)throw new Error('Z.ai article bundle missing');
 await new Promise(r=>setTimeout(r,1100));return fetchText(new URL(path,url).href);
}
const board:Leaderboard={benchmark:'z-ai-code-bench',url:ROOT+'/blog/glm-5.3',feed:ROOT+'/blog/glm-5.3 and /blog/glm-5.3-flash (current article bundles)',
 terms:'Public Z.ai launch results. Benchmark Almanac credits Z.ai and links the source.',
 chart:{title:'Agentic coding accuracy vs output tokens',note:'Only exact numerical points stated in the article text are imported. Token figures are approximate as reported.',x:{key:'tokens',label:'Mean output tokens per task',unit:'tokens',better:'lower'},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch():Promise<LeaderboardRow[]>{const s=await post('glm-5.3');
  const max=s.match(/At Max effort, GLM-5\.3 reaches ([\d.]+)% at roughly ([\d.]+)K output tokens per task, compared with ([\d.]+)% at ([\d.]+)K for GLM-5\.2/);
  const high=s.match(/At High effort, GLM-5\.3 reaches ([\d.]+)% at around ([\d.]+)K output tokens, surpassing Claude Opus 4\.8 at ([\d.]+)% with ([\d.]+)K/);
  const fable=s.match(/Claude Fable 5, which reaches ([\d.]+)% at Max effort/);
  if(!max||!high||!fable)throw new Error('Z.ai exact score/token prose changed');
  const row=(model:string,setting:string,score:string,tokens?:string):LeaderboardRow=>({model,setting,score:Number(score),harness:'Claude Code 2.1.207',...(tokens?{tokens:Number(tokens)*1000}:{})});
  const rows=[row('GLM-5.3','max',max[1],max[2]),row('GLM-5.2','max',max[3],max[4]),row('GLM-5.3','high',high[1],high[2]),row('Claude Opus 4.8','max',high[3],high[4]),row('Claude Fable 5','max',fable[1])];
  await new Promise(r=>setTimeout(r,1100));const flash=await post('glm-5.3-flash');
  const m=flash.match(/at max effort nearly matches Claude Opus 4\.8 \(([\d.]+) vs\. ([\d.]+)\)/);
  if(!m||Number(m[2])!==Number(high[3]))throw new Error('Z.ai Flash comparison changed');
  rows.push(row('GLM-5.3-Flash','max',m[1]));return rows;
 }};
export default board;
