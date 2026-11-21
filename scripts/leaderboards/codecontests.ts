// CodeContests tests generated programs against competitive programming test cases. SOTA2 ranks
// configurations by pass@1. The board also gives pass@2 and pass@5 for some configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { nextFlight, jsonAt } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.sota2.com/research/sota/code-generation-on-codecontests';
type Entry = { methodName:string, primaryMetricValue:number, metricValues:Record<string,number|null>, reportPaperId:string,
  inferenceConfig: Record<string,string|boolean> };
const board: Leaderboard = {
  benchmark:'codecontests', host:'SOTA2 Research', harnesses:'system', url:feed, feed,
  terms:'SOTA2 attributes each result to its reporting paper. ' + feed,
  aliases:{'Llama3.1-70B-Instruct':'llama-3-1-70b','Llama3.1-8B-Instruct':'llama-3-1-8b','Gemma3-27B-it':'gemma-3-27b'},
  stats:{
    passAt2:{name:'Pass@2',unit:'%',better:'higher'},
    passAt5:{name:'Pass@5',unit:'%',better:'higher'},
  },
  async fetch(){
    const data = nextFlight(await fetchText(feed));
    const start = data.indexOf('"results":{"benchmarkId"');
    if (start < 0) throw new Error('Missing CodeContests results');
    const t = jsonAt<{primaryMetricKey:string,total:number,rows:Entry[]}>(data,start + '"results":'.length);
    if (t.primaryMetricKey !== 'Pass@1' || t.total !== t.rows.length) throw new Error('Missing pass@1 rows');
    const rows = new Map<string,LeaderboardRow>();
    for (const r of t.rows) {
      const c = r.inferenceConfig || {};
      const named = c.Backbone || c['Target Model'] || c['Base Model'];
      if (!named && !r.methodName.startsWith('GPT-')) continue;
      const model = String(named || r.methodName.replace(' + CoT',''));
      const harness = named && r.methodName !== 'Single-pass' ? r.methodName : undefined;
      const configuration = Object.entries(c).filter(([k]) => !['Backbone','Target Model','Base Model','Source Model','Evaluation Context','Model Role'].includes(k));
      if (c['Target Model'] && c['Source Model']) configuration.push(['Prompt source',c['Source Model']]);
      const setting = configuration.map(([k,v])=>k + ': ' + v).join(', ') || undefined;
      const score = r.primaryMetricValue;
      if (!Number.isFinite(score) || r.metricValues['Pass@1'] !== score || score<0 || score>100) throw new Error('Invalid CodeContests pass@1');
      const metrics:Record<string,number> = {};
      for (const k of [2,5]) {
        const v = r.metricValues['Pass@'+k];
        if (v !== null && v !== undefined) metrics['passAt'+k] = v;
      }
      const row = { model, harness, setting, score, metrics };
      const key = JSON.stringify([model,harness,setting]);
      if (rows.has(key) && JSON.stringify(rows.get(key)) !== JSON.stringify(row)) throw new Error('Conflicting CodeContests runs');
      rows.set(key,row);
    }
    return checked([...rows.values()],66);
  },
};
export default board;
