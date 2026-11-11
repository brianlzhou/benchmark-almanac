// AutoResearchBench: default Deep Research accuracy, multiplied by 100.
// The page explicitly sorts Deep Research Accuracy. Wide Research stays a metric. Token counts include input and output.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://cheryou.github.io/autoresearchbench.github.io/";
const board: Leaderboard = {
  benchmark: "autoresearchbench",
  url: "https://cheryou.github.io/autoresearchbench.github.io/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=await fetchText(FEED);const read=(k:string)=>jsLiteral<any[]>(s,s.indexOf('[',s.indexOf('const '+k+' =')));
      const rows:LeaderboardRow[]=read('LB_DATA').map(r=>({model:r.name,score:r.ds_acc*100,harness:'ReAct / DeepXiv',metrics:{latency:r.ds_time,totalTokens:r.ds_tok,turns:r.ds_turns,toolCalls:r.ds_tc,wideIoU:r.ws_iou*100}}));
      for(const r of read('E2E_DATA')){const [a,b]=r.ds_acc_str.split('/').map(Number);rows.push({model:r.name,score:a/b*100,metrics:{latency:r.ds_time,wideIoU:r.ws_iou*100}});}return rows;
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
