// LMAct measures imitation from demonstrations in six environments with different reward scales.
// Tables A1 through A10 report one-demonstration scores by observation and prompt setting.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2412.01441';
const tasks = ['Atari: Phoenix','Chess','Chess','Chess','Crosswords','DM Control: Cheetah',
  'Grid world','Grid world','Grid world','Tic-tac-toe'];
const board: Leaderboard = {
  benchmark:'lmact',static:'paper',url,feed:url,
  terms:'The authors publish LMAct at https://github.com/google-deepmind/lm_act under Apache 2.0.',
  headline:'The tasks use different reward scales. The headline is the average game score for Atari: Phoenix, the first task.',
  aliases:{'Gemini 2.0 Flash Exp.':'gemini-2-0-flash-dec-2024'},
  async fetch() {
    const html = await paperHtml(url);
    const parts: Record<string,BoardPart> = {};
    const groups = new Map<string,{model:string,setting:string,metrics:Record<string,number>}>();
    const figures = [...html.matchAll(/<figure\b[^>]*class="ltx_table"[^>]*>([\s\S]*?)<\/figure>/g)];
    for (const [i,task] of tasks.entries()) {
      const figure = figures.find(f => f[1].includes('Table A'+(i+1)+'</span>'));
      const t = figure && paperTables(figure[1]).map(grid)[0];
      if (t?.[0]?.join('|') !== 'Model|Observation|Legal Actions|Chain-of-Thought|Average Score')
        throw new Error('Missing LMAct Table A'+(i+1));
      for (const r of t.slice(1)) {
        if (r.length < 5) continue; // Span expansion can produce empty trailing rows.
        const [model,obs,legal,cot,score] = r;
        if (![legal,cot].every(v=>v==='True'||v==='False')) throw new Error('Unknown prompt condition');
        const setting = 'One demonstration, legal actions '+(legal==='True'?'shown':'hidden')+
          ', chain of thought '+(cot==='True'?'on':'off');
        const key = JSON.stringify([model,setting]);
        const group = groups.get(key) ?? {model,setting,metrics:{} as Record<string,number>};
        const part = task+' ('+obs+')';
        parts[part] = {name:part,unit:'score',note:'Average reward in the task’s own units.'};
        group.metrics[part] = numberCell(score);
        groups.set(key,group);
      }
    }
    board.parts = parts;
    const first = 'Atari: Phoenix (RGB)';
    return checked([...groups.values()].filter(g=>first in g.metrics).map(g=>({...g,score:g.metrics[first]})),20);
  },
};
export default board;
