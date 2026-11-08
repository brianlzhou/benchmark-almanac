// AgenticDataBench: Total is the authors full-benchmark skill score in percent.
// Table 4 defines the three model symbols and four harnesses. Table 5 reports mean cost per task.
// Tokens combine input and output, so they remain totalTokens in metrics rather than output tokens.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2607.01647";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "agenticdatabench",
  url: "https://github.com/AgenticDataBench/AgenticDataBench",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  chart: { title: 'Score versus cost', x: {key: 'costPerTask', label: 'Cost per task', unit: '$', better: 'lower'}, y: {key: 'score', label: 'Score', unit: '%', better: 'higher'} },
  async fetch(): Promise<LeaderboardRow[]> {
    const ts=await paperTables(FEED), total=ts[3]?.find(r=>r[0]?.text==='Total');
    const efficiency=ts[4]?.filter(r=>r.length===6 && /^(SA|DA|CC|CX) /.test(r[0].text));
    if(total?.length!==13 || efficiency?.length!==12)throw new Error('AgenticDataBench tables changed');
    const models=['Qwen3.5-397B-A17B','Kimi-K2.5','Claude Sonnet 4.6'];
    const harnesses=['Smolagents','DA-Agent','Claude Code','Codex'];
    return efficiency.map((r,i)=>({model:models[i%3],harness:harnesses[Math.floor(i/3)],score:num(total[i+1].text)!,cost:num(r[3].text)!,metrics:{costPerTask:num(r[3].text)!,steps:num(r[1].text)!,totalTokens:num(r[2].text)!*1000,successfulSteps:num(r[4].text)!,finishRate:num(r[5].text)!}}));
  },
};
export default board;
