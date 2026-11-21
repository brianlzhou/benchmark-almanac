// Groups of ten agents use binary feedback to coordinate guesses of a target number.
// Table A2 reports success percentages for three prompting conditions under four alternative backbones.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2510.05174';
const board: Leaderboard = {
  benchmark:'group-binary-search-riedl', url:'https://github.com/riedlc/AI-GBS',feed,static:'paper',
  terms:'The author publishes Table A2 at https://arxiv.org/abs/2510.05174.',
  aliases:{'Qwen3':'qwen3-235b-a22b-instruct-jul-2025'},
  stats:{groupsWithSignificantDifferentiation:{name:'Groups with significant differentiation',unit:'%',note:'Percentage of groups with statistically significant differentiation.'}},
  async fetch() {
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[1]?.[0]==='Group Performance');
    if (!t || t[0].join('|')!=='|Llama-3.1-8B|Llama-3.1-70B|Gemini 2.0 flash|Qwen3') throw new Error('Missing group performance table');
    function percentage(cell:string) {
      if (!cell?.endsWith('%')) throw new Error('Missing percentage in Table A2');
      return numberCell(cell.slice(0,-1));
    }
    return checked(['Plain','Persona','ToM'].flatMap(condition=>{
      const success=t.find(r=>r[0]==='Success '+condition), differentiation=t.find(r=>r[0]===condition);
      if (!success || !differentiation) throw new Error('Missing treatment '+condition);
      return t[0].slice(1).map((model,i)=>({model, setting:condition==='ToM'?'Persona + ToM':condition,
        score:percentage(success[i+1]),metrics:{groupsWithSignificantDifferentiation:percentage(differentiation[i+1])}}));
    }),12);
  },
};
export default board;
