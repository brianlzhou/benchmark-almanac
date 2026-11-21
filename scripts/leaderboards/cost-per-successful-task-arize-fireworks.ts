// Cost per Successful Task measures the dollars spent per successful task across 2,400 runs.
// Lower is better. The importer reads Arize's published comparison table.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables} from '../lib/html.ts';
const URL='https://arize.com/blog/cost-per-successful-task-ai-model-benchmark/';
const board:Leaderboard={benchmark:'cost-per-successful-task-arize-fireworks',url:URL,feed:URL,terms:'Public Arize results. Attribution and source licensing apply.',async fetch(){const t=tables(await fetchText(URL))[0]?.map(r=>r.map(c=>c.text));if(!t)throw new Error('cost table missing');const rows=t.slice(1).map(r=>({model:r[0],score:Number(r[4].replace(/[$,]/g,'')),metrics:{passRate:Number(r[2].replace('%','')),meanAttemptUsd:Number(r[3].replace('$','')),retryTax:Number(r[5].replace('×','').replace('x',''))}}));return rows as LeaderboardRow[];}};export default board;
