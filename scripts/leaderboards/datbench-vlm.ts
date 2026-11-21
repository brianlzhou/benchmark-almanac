// DatBench tests nine visual capabilities. Table 3 gives accuracy for the DatBench subset in its DB columns.
// The evaluation library defines overall_accuracy over "all scored samples (direct and judge)".
// Weight each reported capability accuracy by its released test-set size. The published inputs are rounded.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { fetchJson } from '../lib/util.ts';
const feed = 'https://arxiv.org/html/2601.02316';
const sizeUrl = 'https://datasets-server.huggingface.co/size?dataset=DatologyAI%2FDatBench';
const columns = ['Chart','Doc','OCR','Grd','Cnt','Spa','Mth','Dia','Gen'];
const keys = ['chart','document','scene','grounding','counting','spatial','math','table','general'];
export default {
  benchmark:'datbench-vlm',static:'paper',url:feed,feed,
  aliases:{'InternVL3-2B-Instruct':'internvl3-2b','InternVL3-9B-Instruct':'internvl3-9b',
    'InternVL3_5-4B-Instruct':'internvl3-5-4b','InternVL3_5-8B-Instruct':'internvl3-5-8b'},
  terms:'Paper and license at https://arxiv.org/abs/2601.02316',
  headline:'This is sample-weighted accuracy calculated from the rounded DatBench capability scores and released test-set sizes.',
  parts:{chart:'Chart Understanding',document:'Document Understanding',scene:'Scene OCR',grounding:'Grounding',counting:'Counting',
    spatial:'Spatial Reasoning',math:'Math & Logic',table:'Diagrams & Tables',general:'General VQA'},
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.slice(0,4).join('|') === 'Model|DB|Full|Orig');
    if (!t || columns.some((name,i) => t[0][1+3*i] !== name || t[1][1+3*i] !== 'DB')) throw new Error('Missing DB columns');
    const sizes = await fetchJson<{size:{splits:{config:string;split:string;num_rows:number}[]}}>(sizeUrl);
    const counts = Object.fromEntries(sizes.size.splits.filter(s => s.split === 'test').map(s => [s.config,s.num_rows]));
    if (keys.some(k => !Number.isInteger(counts[k]) || counts[k]<1)) throw new Error('Missing capability sizes');
    const n = keys.reduce((sum,k) => sum+counts[k],0);
    const rows = t.slice(2).filter(c => !c.every(v => v===c[0]) && keys.every((_,i) => !['–','—','-',''].includes(c[1+3*i]))).map(c => {
      const metrics = Object.fromEntries(keys.map((k,i) => [k,numberCell(c[1+3*i])]));
      return {model:c[0],score:keys.reduce((sum,k) => sum+metrics[k]*counts[k],0)/n,metrics};
    });
    return checked(rows,26);
  },
} satisfies Leaderboard;
