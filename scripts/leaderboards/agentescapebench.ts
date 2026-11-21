// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// AgentEscapeBench tests whether agents solve generated escape rooms. Table 1 reports success,
// resolution and discovery rates by difficulty. Tables 2 and 3 add errors and tool calls.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2605.07926';
const levels=[5,10,15,20,25];
const rates=['Success rate','Sub-problem resolution rate','Discovery rate'];
const errors=['Missing required parameter','Wrong node type','Wrong call format'];
const parts:Record<string,BoardPart>={drop:{name:'Success rate drop',unit:'%',better:'lower'}};
const stats: Record<string, {name:string, unit?:string, better?:'higher'|'lower'}> = {};
for (const level of levels) {
  const group = 'Difficulty-' + level;
  parts['d' + level + 'SR'] = {name:'Success rate', group, unit:'%', better:'higher'};
  parts['d' + level + 'Sub'] = {name:'Sub-problem resolution rate', group, unit:'%', better:'higher'};
  parts['d' + level + 'Disc'] = {name:'Discovery rate', group, unit:'%', better:'higher'};
  if (level < 25) {
    stats['d' + level + 'error0'] = {name:'Missing required parameter errors, difficulty ' + level, unit:'count', better:'lower'};
    stats['d' + level + 'error1'] = {name:'Wrong node type errors, difficulty ' + level, unit:'count', better:'lower'};
    stats['d' + level + 'error2'] = {name:'Wrong call format errors, difficulty ' + level, unit:'count', better:'lower'};
    stats['d' + level + 'calls'] = {name:'Tool calls per instance, difficulty ' + level, unit:'count'};
  }
}
const board:Leaderboard={
  benchmark:'agentescapebench',static:'paper',url,feed:url,terms:PAPER_TERMS,parts,stats,
  headline:'The paper gives no overall score across all five difficulty levels, so this is the plain mean of their success rates.',
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid);
    const main=ts.find(t=>t[0]?.[1]==='Difficulty-5' && t[0]?.[13]==='Difficulty-25' && t[1]?.[1]==='SR');
    const counts=ts.find(t=>t[0]?.includes('Miss. Required Param.') && t[0]?.includes('Wrong Call Format'));
    const calls=ts.find(t=>t[0]?.join('|')==='Model|Diff-5|Diff-10|Diff-15|Diff-20');
    if (!main || !counts || !calls) throw new Error('Missing reviewed tables');
    const rows:LeaderboardRow[]=[];
    for(const [model,...cells] of main.slice(2)){
      if (/^Human|^‡/.test(model) || cells.includes('—')) continue;
      const e=counts.find(r=>r[0]===model);
      const c=calls.find(r=>r[0]===model);
      if (!e || !c || cells.length!==16) throw new Error('Missing model diagnostics');
      const metrics:Record<string,number>={drop:Number(cells[15])};
      for (const [i,level] of levels.entries()){
        const group='Difficulty-'+level;
        function add(suffix:string,name:string,value:string,unit:string,better:'higher'|'lower'){
          if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid '+name);
          const key='d'+level+suffix;
          parts[key]={name,group,unit,better};
          metrics[key]=Number(value);
        }
        rates.forEach((name,j)=>add(['SR','Sub','Disc'][j],name,cells[3*i+j],'%','higher'));
        if (i<4){
          errors.forEach((name,j)=>{ const key='d'+level+'error'+j; if (!/^\d+(?:\.\d+)?$/.test(e[1+5*j+i])) throw new Error('Invalid '+name); metrics[key]=Number(e[1+5*j+i]); });
          const key='d'+level+'calls'; if (!/^\d+(?:\.\d+)?$/.test(c[i+1])) throw new Error('Invalid tool calls'); metrics[key]=Number(c[i+1]);
        }
      }
      rows.push({model,metrics,score:levels.reduce((s,d)=>s+metrics['d'+d+'SR'],0)/5});
    }
    return checked(rows,3);
  },
};
export default board;
