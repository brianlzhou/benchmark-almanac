// CoffeeBench measures Roaster A's cumulative net income in simulated dollars over 90 days.
// The authors' replay summary gives the final three-seed mean with Sonnet 4.6 counterparties.
// Paper Tables 8 and 10 give newer runs with Sonnet 5.5 counterparties and two agent harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2606.16613';
const replay = 'https://pub.sakana.ai/coffeebench/data/replay/summary.json';
function number(s:string) {
  const v = s.replace(/\\mathbf|\\pm|[{},\s]/g,'');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid financial result '+s);
  return Number(v);
}
function modelConfig(name:string) {
  const m = /^(.*) \((max|high|low)\)$/.exec(name);
  if (!m) throw new Error('Unknown CoffeeBench effort for '+name);
  return {model:m[1],setting:m[2]+' effort, Claude Sonnet 5.5 counterparties'};
}
const board: Leaderboard = {
  benchmark:'coffeebench-sakana',static:'paper',url,feed:replay+' and '+url,costPer:'run',
  terms:'The authors publish the replay at https://pub.sakana.ai/coffeebench/trajectories.html and list the paper license at https://arxiv.org/abs/2606.16613.',
  headline:'The score is Roaster A’s mean 90-day net income in simulated dollars.',
  async fetch() {
    const old = await fetchJson<{agent_under_eval:string,day_axis:number[],models:{display:string,cum_net_income:number[]}[]}>(replay);
    if (old.agent_under_eval !== 'roaster_A' || old.day_axis.length !== 90 || old.day_axis.some((day,i) => day !== i)) throw new Error('Invalid 90-day series');
    const rows: LeaderboardRow[] = old.models.filter(m => !['Heuristic','Passive'].includes(m.display)).map(m => {
      if (m.cum_net_income.length !== 90) throw new Error('Incomplete series for '+m.display);
      return {model:m.display,setting:'Claude Sonnet 4.6 counterparties',trials:3,score:m.cum_net_income[89]};
    });
    const tables = paperTables(await paperHtml(url)).map(grid);
    const labels = ['Net income ($)','Revenue ($)','Margin (%)','Actions','DMs','LLM calls','API cost ($)'];
    const effort = tables.find(t => t[0]?.join('|') === ['Model',...labels.flatMap(x => [x,x])].join('|'));
    const harness = tables.find(t => t[0]?.[1] === 'Terminus-2' && t[0]?.[5] === 'mini-SWE-agent');
    if (!effort || !harness || harness[1].slice(1,5).join('|') !== 'Net income ($)|Net income ($)|API cost ($)|API cost ($)') throw new Error('Missing paper tables');
    for (const [name,...cells] of effort.slice(1)) {
      if (cells.length !== 14) throw new Error('Missing effort metrics');
      const [score,std,revenue,revenueStd,margin,marginStd,actions,actionsStd,dms,dmsStd,llmCalls,llmCallsStd,cost,costStd] = cells.map(number);
      rows.push({...modelConfig(name),harness:'mini-SWE-agent',trials:3,score,cost,metrics:{std,revenue,revenueStd,margin,marginStd,actions,actionsStd,dms,dmsStd,llmCalls,llmCallsStd,costStd}});
    }
    for (const [name,...cells] of harness.slice(2)) {
      if (['HeuristicRoaster','PassiveRoaster'].includes(name)) continue;
      const [score,std,cost,costStd] = cells.slice(0,4).map(number);
      rows.push({...modelConfig(name),harness:'Terminus-2',trials:3,score,cost,metrics:{std,costStd}});
    }
    return checked(rows,30);
  },
};
export default board;
