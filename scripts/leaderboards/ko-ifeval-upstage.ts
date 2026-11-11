// The official Ko-LLM reader defines Ko-IFEval as "np.mean([ko_ifeval["prompt_level_strict_acc,none"], ko_ifeval["inst_level_strict_acc,none"]])" times 100. This reader follows that plain mean. It discovers every result file from the current repository manifest. It keeps the latest result per model, precision, and shot count. The archive is large and requests are paced at two seconds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://huggingface.co/api/datasets/open-ko-llm-leaderboard/results";
const board: Leaderboard = {
  benchmark: "ko-ifeval-upstage",
  url: "https://huggingface.co/spaces/upstage/open-ko-llm-leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const manifest=await fetchJson<any>(FEED);if(!Array.isArray(manifest.siblings))throw new Error('Missing results manifest');
const files=manifest.siblings.map((x:any)=>x.rfilename).filter((x:string)=>/\.json$/.test(x)).sort();
const selected=new Map<string,{row:LeaderboardRow;stamp:string}>();let last=Date.now();let count=0;
for(const file of files){await new Promise(r=>setTimeout(r,Math.max(0,2100-(Date.now()-last))));last=Date.now();
 const d=await fetchJson<any>('https://huggingface.co/datasets/open-ko-llm-leaderboard/results/raw/main/'+file.split('/').map(encodeURIComponent).join('/'));
 const k=d.results?.ko_ifeval;if(!k)continue;const c=d.config_general||d.config;if(!c?.model_name)throw new Error('Missing model identity in '+file);
 const strict=k['prompt_level_strict_acc,none'],inst=k['inst_level_strict_acc,none'];if(!Number.isFinite(strict)||!Number.isFinite(inst))throw new Error('Missing strict scores in '+file);
 const setting=[c.model_dtype,c.num_few_shot_default==null?null:`${c.num_few_shot_default}-shot`].filter(Boolean).join(', ');
 const metrics:Record<string,number>={promptStrict:strict*100,instructionStrict:inst*100};for(const [key,name] of [['prompt_level_loose_acc,none','promptLoose'],['inst_level_loose_acc,none','instructionLoose']])if(typeof k[key]==='number')metrics[name]=100*k[key];
 const stamp=file.split('/').at(-1)!;const date=stamp.match(/\d{4}-\d{2}-\d{2}/)?.[0];const key=JSON.stringify([c.model_name,setting]);const prior=selected.get(key);
 if(!prior||stamp>prior.stamp)selected.set(key,{stamp,row:{model:c.model_name,score:50*(strict+inst),setting,date,metrics}});
 if(++count%100===0)console.error(`Ko-IFEval: read ${count}/${files.length} scored files`);
}return [...selected.values()].map(x=>x.row);

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
