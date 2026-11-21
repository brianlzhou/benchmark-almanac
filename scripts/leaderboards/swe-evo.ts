// SWE-EVO tests repository evolution from release notes. Tables 2 and 4 report resolved rates by
// agent and context. Tables 6 and 7 add fix rates and test diagnostics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2512.18470';
const board: Leaderboard = {
  benchmark: 'swe-evo', static: 'paper', url: 'https://arxiv.org/abs/2512.18470', feed, terms: PAPER_TERMS,
  reference: ['OpenHands','SWE-agent'],
  aliases: { 'gpt-5-08-07':'gpt-5', 'gpt-5-mini-08-07':'gpt-5-mini', 'gpt-5-nano-08-07':'gpt-5-nano', 'deepseek-v3p2':'deepseek-v3-2', 'deepseek-v3p1':'deepseek-v3-1', 'glm-4p7':'glm-4-7', 'glm-4p5':'glm-4-5', 'kimi-k2p5':'kimi-k2-5', 'gpt-4o-2024-11-20':'gpt-4o-nov-2024' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const main = tables.find(t => t[2]?.[2] === '% Resolved' && t[2][3] === '% Apply');
    const context = tables.find(t => t[0]?.[1] === 'release-note only' && t[1]?.[1] === 'OpenHands');
    const fix = tables.find(t => t[1]?.[3] === 'Fix (%)');
    const tests = tables.find(t => t[1]?.[1] === 'FAIL_TO_PASS');
    if (!main || !context || !fix || !tests) throw new Error('Missing SWE-EVO tables');
    const rows: LeaderboardRow[] = [];
    const shortened: Record<string,string> = {'gpt-4.1-2025-04-14':'gpt-4.1','gpt-4o-2024-11-20':'gpt-4o','deepseek-r1-0528':'deepseek-r1','qwen3-coder-480b-a35b':'qwen3-coder-480b'};
    for (const r of main.slice(3)) {
      const model = r[1], f = fix.find(x => x[1] === model), d = tests.find(x => x[0] === (shortened[model] || model));
      if (!f) throw new Error('Missing SWE-EVO fix rate for '+model);
      for (const [i,harness] of ['OpenHands','SWE-agent'].entries()) {
        const j = 2+2*i;
        rows.push({model,harness,setting:context[0][3],score:numberCell(r[j]), metrics:{
          apply:numberCell(r[j+1]),fix:numberCell(f[j+1]), ...(d ? {failToPass:numberCell(d[j-1]),passToPass:numberCell(d[j])} : {})}});
      }
    }
    for (const [model,a,b] of context.slice(2)) {
      rows.push({model,harness:'OpenHands',setting:context[0][1],score:numberCell(a)},
        {model,harness:'SWE-agent',setting:context[0][1],score:numberCell(b)});
    }
    if (rows.length < 56) throw new Error('Missing SWE-EVO runs');
    return rows;
  },
};
export default board;
