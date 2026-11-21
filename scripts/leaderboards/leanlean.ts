// LeanLean scores the percentage of Lean tokens agents remove while passing the verifier.
// MathArena publishes the October competition table with cost, time, retries and average token counts.
import type { Leaderboard } from './types.ts';
import { matharenaFeed } from '../lib/boards/matharena.ts';
import { fetchJson } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://matharena.ai/competition_tables/leanlean--oct26";


const board: Leaderboard = {
  benchmark: "leanlean",
  url: "https://matharena.ai/?comp=leanlean--oct26",
  feed,
  terms: "The MathArena repository uses the MIT license. Board reuse terms need review at https://matharena.ai/ The robots.txt URL serves HTML.",
  async fetch() {
    const {table} = await fetchJson<{table:string}>(matharenaFeed('leanlean--oct26'));
    const t = tables(table)[0], head = t[0].map(c=>c.text);
    for (const key of ['Model Name','Score','Cost','Output Tokens','Input Tokens','Average Retries','Average Time','Origin']) {
      if (!head.includes(key)) throw new Error('Missing LeanLean column: '+key);
    }
    const rows = t.slice(1).map(r=>{
      const cell = (key:string)=>r[head.indexOf(key)];
      const model = cell('Model Name').text, score = num(cell('Score').text);
      if (!model || score===undefined) throw new Error('Incomplete LeanLean row');
      const time = /(?:(\d+)h )?(?:(\d+)m )?(\d+)s/.exec(cell('Average Time').text);
      const metrics:Record<string,number> = {};
      for (const [k,col] of [['inputTokens','Input Tokens'],['averageRetries','Average Retries']]) {
        const value=num(cell(col).text); if(value!==undefined) metrics[k]=value;
      }
      if(time) metrics.latency=Number(time[1]||0)*3600+Number(time[2]||0)*60+Number(time[3]);
      for (const m of cell('Origin').text.matchAll(/([A-Za-z][A-Za-z ]+): ([+-][\d.]+) pp/g)) metrics[m[1].trim()]=Number(m[2]);
      const harness = cell('Model Name').html.match(/title="([^"]+)"/)?.[1].split(' · ')[0];
      return {model, score, harness, cost:num(cell('Cost').text), tokens:num(cell('Output Tokens').text), metrics};
    });
    if (rows.length < 5) throw new Error('Expected five scored LeanLean configurations');
    return rows;
  },
};
export default board;
