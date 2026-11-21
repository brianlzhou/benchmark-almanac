// InfiHall-Bench tests whether generated images meet several visual requirements at once.
// Table 3 reports an Overall score and separate scores for each of five visual skills.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables,grid,checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2611.18053';
const skills=['Action Rel.','Attribute','Part','Scene','Spatial Rel.'];
const board:Leaderboard={
  benchmark:'infihall-bench',static:'paper',url:feed,feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  aliases:{'SD3.5-Large':'stable-diffusion-3-5-large'},
  parts:Object.fromEntries(skills.map(name=>[name,name])),
  async fetch(){
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.join('|')===['Model',...skills,'Overall'].join('|'));
    if(!t) throw Error('Missing Table 3 overall and skill scores');
    let model='';
    const rows:LeaderboardRow[]=[];
    for(const cells of t.slice(1)){
      if(cells[0]===cells[1]) continue;
      const variant=cells[0].startsWith('+ ');
      if(!variant) model=cells[0];
      if(variant && !model.startsWith('Infinity-')) throw Error('Missing base model for '+cells[0]);
      const values=cells.slice(1).map(s=>s.trim()?Number(s):NaN);
      if(values.length!==6 || !values.every(Number.isFinite)) throw Error('Invalid scores for '+model);
      rows.push({model,setting:variant?cells[0].slice(2).replace(' (Ours)',''):undefined,
        score:values[5],metrics:Object.fromEntries(skills.map((name,i)=>[name,values[i]]))});
    }
    return checked(rows,16);
  },
};
export default board;
