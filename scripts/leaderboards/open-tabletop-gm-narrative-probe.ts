// The original Tabletop GM probe scores narration on a five-point scale. The author’s eight-model release reports the mean of three judge dimensions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, githubHeaders } from '../lib/util.ts';

const feed = "https://api.github.com/repos/Bobby-Gray/open-tabletop-gm/contents/probe/results/narrative?ref=ac5579736dae04cca65d7cdbe76273fde8c0bd86";
interface Run {model:string;timestamp:string;auto_summary:Record<string,number>;judge_averages:Record<string,number>;cases:{completion_tokens:number;elapsed_s:number}[]}

const board: Leaderboard = {
  benchmark: "open-tabletop-gm-narrative-probe",
  url: "https://www.reddit.com/r/LocalLLaMA/comments/1spfz31/i_tested_8_llms_as_tabletop_gms_a_27b_model_beat/",
  feed,
  terms: "The author gives no separate license for the results table in this post. https://www.reddit.com/r/LocalLLaMA/comments/1spfz31/i_tested_8_llms_as_tabletop_gms_a_27b_model_beat/ Reddit disallows general crawling. The author’s repository declares AGPL-3.0-or-later.",
  parts:{atmosphere:'atmosphere',npc_craft:'npc_craft',gm_craft:'gm_craft'},
  stats: {
    PASS: { name: 'Pass cases', unit: 'count' },
    WARN: { name: 'Warning cases', unit: 'count' },
    FAIL: { name: 'Failed cases', unit: 'count', better: 'lower' },
    latency: { name: 'Average case latency', unit: 'seconds', better: 'lower' },
  },
  async fetch(){
    const files = (await fetchJson<{download_url:string;html_url:string;name:string}[]>(feed, { headers: githubHeaders() })).filter(f=>f.name.endsWith('.json'));
    if(files.length !== 8) throw new Error('Expected eight original probe runs');
    const rows:LeaderboardRow[]=[];
    for(const f of files){
      if(rows.length) await new Promise(resolve=>setTimeout(resolve,1000));
      const r=await fetchJson<Run>(f.download_url);
      const dims=['atmosphere','npc_craft','gm_craft'].map(k=>r.judge_averages[k]);
      if(!r.model || r.cases.length!==6 || !dims.every(Number.isFinite)) throw new Error('Incomplete narrative run');
      const mean=(key:'elapsed_s'|'completion_tokens')=>r.cases.reduce((s,c)=>s+c[key],0)/r.cases.length;
      rows.push({model:r.model,date:r.timestamp.slice(0,10),score:dims.reduce((a,b)=>a+b,0)/3,link:f.html_url,
        tokens:mean('completion_tokens'),metrics:{...r.judge_averages,...r.auto_summary,latency:mean('elapsed_s')}});
    }
    return rows;
  },
};
export default board;
