// FinFIRST tests whether financial search agents give correct answers with verifiable evidence.
// Table 3 reports Strict Pass over all 123 questions. Table 4 reports unsupported-correct rates.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2609.25192';
const board: Leaderboard = {
  stats: { atomic: { name: 'Atomic pass rate', unit: '%', better: 'higher' }, loose: { name: 'Loose pass rate', unit: '%', better: 'higher' }, rounds: { name: 'Rounds', unit: 'count' }, toolCalls: { name: 'Tool calls', unit: 'count' }, maxToolCalls: { name: 'Maximum tool calls', unit: 'count' }, wrongUnsupported: { name: 'Wrong unsupported answers', unit: 'count' }, wrongPartial: { name: 'Wrong partial answers', unit: 'count' }, correctPartial: { name: 'Correct partial answers', unit: 'count' }, correctTraceable: { name: 'Correct traceable answers', unit: 'count' }, notApplicable: { name: 'Not applicable answers', unit: 'count' }, ucr: { name: 'Unsupported correct rate', unit: '%', better: 'lower' } },
  benchmark:'finfirst', url:'https://huggingface.co/datasets/inclusionAI/FinFIRST', feed, static:'paper',
  terms:'The authors release the benchmark under Apache 2.0. https://huggingface.co/datasets/inclusionAI/FinFIRST',
  parts:{raw:'Raw-information',source:'Source verification',computation:'Computation & answer'},
  aliases:{'Hunyuan3-Thinking':'tencent-hy3','DeepSeek-V4-Flash':'deepseek-v4-flash-0731','DeepSeek-V4-Pro':'deepseek-v4-pro-0813'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const scores = tables.find(t => t[1]?.[3] === 'Strict Pass');
    const evidence = tables.find(t => t[0]?.at(-1)?.startsWith('UCR (%)'));
    if (!scores || !evidence || scores[1].slice(1,7).join('|') !== 'Atomic|Loose Pass|Strict Pass|Raw- information|Source verification|Computation & answer' ||
        scores[1].slice(7).map(s=>s.split(' \\')[0]).join('|') !== 'Avg. rounds|Avg. tool calls|Max. tool calls')
      throw new Error('FinFIRST Tables 3 and 4 changed');
    return checked(scores.slice(2).map(([label,...cells]) => {
      const row = evidence.find(r => r[0] === label);
      if (!row || row.length !== 7 || cells.length !== 9) throw new Error('Missing FinFIRST result for '+label);
      const [atomic,loose,score,raw,source,computation,rounds,toolCalls,maxToolCalls] = cells.map(numberCell);
      const [wrongUnsupported,wrongPartial,correctPartial,correctTraceable,notApplicable,ucr] = row.slice(1).map(numberCell);
      return {model:label.replace(/ †$/,''), harness:'ReAct', score, metrics:{atomic,loose,raw,source,computation,
        rounds,toolCalls,maxToolCalls,wrongUnsupported,wrongPartial,correctPartial,correctTraceable,notApplicable,ucr}};
    }),15);
  },
};
export default board;
