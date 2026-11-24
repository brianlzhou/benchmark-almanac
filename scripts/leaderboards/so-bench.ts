// SO-Bench checks structured model outputs against image-grounded schemas. Table 1
// reports schema validation first, followed by exact and fuzzy field and full matches.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2511.21750';
const metrics = ['Field Match (Exact)','Full Match (Exact)','Field Match (Fuzzy)','Full Match (Fuzzy)'];
const board: Leaderboard = {
  benchmark:'so-bench',static:'paper',url,feed:url,
  terms:'The authors publish Table 1 under the license linked at https://arxiv.org/abs/2511.21750.',
  stats:Object.fromEntries(metrics.map(name=>[name,{name,unit:'%',better:'higher' as const}])),
  aliases:{'Claude-4.5-Haiku':'claude-haiku-4-5','Claude-4.5-Sonnet':'claude-sonnet-4-5',
    'LLama-4-Scout (17B-16E)':'llama-4-scout','Pixtral-2409 (12B)':'pixtral-12b',
    'Intern3.5-VL (4B)':'internvl3-5-4b','Intern3.5-VL (38B)':'internvl3-5-38b',
    'Qwen2.5-VL (3B)':'qwen2-5-vl-3b','Qwen2.5-VL (32B)':'qwen2-5-vl-32b','Qwen2.5-VL (72B)':'qwen2-5-vl-72b'},
  async fetch() {
    const t = paperTables(await paperHtml(url)).map(grid).find(t=>t[0]?.join('|')===['Models','Schema Val.',...metrics].join('|'));
    if (!t) throw new Error('Missing SO-Bench Table 1');
    return checked(t.slice(1).map(([label,...cells])=>{
      if (cells.length!==5) throw new Error('Missing metric');
      const n = cells.map(c=>numberCell(c.replace(/^\\bf\s+/,'')));
      return {model:label.replace(/\s*\( [^()]*\d{4}[a-z]? \)$/,''), score:n[0],
        metrics:Object.fromEntries(metrics.map((name,i)=>[name,n[i+1]]))};
    }),22);
  },
};
export default board;
