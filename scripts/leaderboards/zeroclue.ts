// ZeroCLUE publishes its overall Score and nine Chinese-language task scores for each submission.
// The live leaderboard reads twenty rows per page from the publisher's results API.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed='https://www.cluebenchmarks.com/api/zerocluem/';
const parts={eprstmt:'EPRSTMT',csldcp:'CSLDCP',tnewsf:'TNEWS',iflytekf:'IFLYTEK',ocnlif:'OCNLI',bustm:'BUSTM',chidf:'CHID',cslf:'CSL',cluewscf:'CLUEWSC'};
const board:Leaderboard={
 benchmark:'zeroclue',url:'https://www.cluebenchmarks.com/zeroclue.html',feed,parts,
 terms:'The publisher links its public leaderboard from the ZeroCLUE README. No separate reuse license was found. The leaderboard host returns 404 for robots.txt.',
 verified:'certified by CLUE',
 async fetch(){
   const rows:LeaderboardRow[]=[];const ids=new Set<string>();let total=0;
   for(let page=1;page===1 || ids.size<total;page++){
     if(page>1) await new Promise(resolve=>setTimeout(resolve,1050));
     const form=new FormData();form.set('page',String(page));
     const d=await fetchJson<{status:number;total:number;data:Record<string,string|number>[]}>(feed,{method:'POST',body:form});
     if(!d.status || Number(d.total)<492 || !d.data.length || (page>1 && total!==Number(d.total))) throw new Error('Incomplete ZeroCLUE page '+page);
     total=Number(d.total);
     for(const r of d.data){
       const id=String(r.id);if(!r.id || ids.has(id)) throw new Error('Duplicate or missing submission ID');ids.add(id);
       const model=text(String(r.model??'')).trim();
       if(model.toLowerCase()==='human') continue;
       const numeric=(k:string)=>{const v=text(String(r[k]??'')).trim();if(!v || !Number.isFinite(Number(v))) throw new Error('Missing '+k+' on '+id);return Number(v);};
       if(!model) throw new Error('Missing model on '+id);
       rows.push({model,score:numeric('score'),metrics:Object.fromEntries(Object.keys(parts).map(k=>[k,numeric(k)])),
         date:String(r.date),submitter:text(String(r.team??'')),setting:'Submission '+id,verified:r.verify==='已认证',
         link:/^https?:\/\//i.test(String(r.url))?String(r.url):undefined});
     }
   }
   if(ids.size!==total || !rows.length) throw new Error('Incomplete ZeroCLUE standings');
   return rows;
 }
};
export default board;
