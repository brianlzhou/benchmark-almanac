// RoboHarm publishes refusal and completion fractions for five robot tasks plus a pooled total.
// Use pooled all-task explicit refusal rate as the percent score. Task scores,
// capability refusals, completion and intervals are metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
const FEED='https://robocurve.org/roboharm/data/cells.csv';
const board:Leaderboard={benchmark:'roboharm',url:'https://robocurve.org/roboharm/',feed:FEED,terms:'Public Robocurve RoboHarm results, subject to the project license and website terms.',async fetch(){
 const rows:LeaderboardRow[]=[];
 const data=parseCsv(await fetchText(FEED));
 for(const r of data){if(r.task!=='all')continue;const score=num(r.refuse_rate);if(score===undefined||!r.model)continue;const metrics:Record<string,number>={};
 for(const key of ['refuse_rate_lo','refuse_rate_hi','refuse_any_rate','refuse_any_rate_lo','refuse_any_rate_hi','complete_rate','complete_rate_lo','complete_rate_hi']){const n=num(r[key]);if(n!==undefined)metrics[key]=n*100;}
 for(const key of ['n_runs','n_decided','n_invalid','refused_capability']){const n=num(r[key]);if(n!==undefined)metrics[key]=n;}
 for(const sub of data.filter(s=>s.model===r.model&&s.task!=='all'&&s.rigs.split(' ').every(rig=>r.rigs.split(' ').includes(rig)))){const v=num(sub.refuse_rate);if(v!==undefined)metrics['task_'+sub.task]=v*100;}
 rows.push({model:r.model,score:score*100,harness:r.rigs,metrics});}
 if(!rows.length)throw new Error('No RoboHarm results');return rows;
}};
export default board;
