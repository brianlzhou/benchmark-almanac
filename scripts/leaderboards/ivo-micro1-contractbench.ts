// Ivo x micro1 ContractBench. A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["ivo-micro1-contract-bench"], read as data. Its default tab,
// Pass score (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';
import { MICRO1_ALIASES, MICRO1_TERMS, micro1Data } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/ivo-micro1-contract-bench';

const board: Leaderboard = {
  benchmark: 'ivo-micro1-contractbench',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "ivo-micro1-contract-bench", Pass score)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const rows=await micro1Data(PAGE,'ivo-micro1-contract-bench');
    const card=await fetchText('https://huggingface.co/datasets/micro1-inc/ContractBench/resolve/main/README.md');
    const t=markdownTables(card).find(t=>t[0].includes('Full benchmark (350 tasks)'));
    if(!t)throw new Error('ContractBench full-benchmark table missing');
    for(const r of t.slice(1)){
      const model=r[0].startsWith('Opus ')?'Claude '+r[0]:r[0],score=num(r[3]);if(score===undefined)continue;
      const metrics={privateScore:num(r[1])!,publicScore:num(r[2])!,completionRate:num(r[4])!};
      const found=rows.find(x=>x.model===model);
      if(found){if(Math.abs(found.score-score)>0.01)throw new Error('ContractBench sources disagree for '+model);found.metrics={...found.metrics,...metrics};}
      else rows.push({model,score,metrics});
    }
    return rows;
  },
};
export default board;
