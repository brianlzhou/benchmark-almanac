// ChartMimic: the maker’s Overall column combines the reported high-level and low-level evaluation.
// The public chart already publishes Overall, so no new aggregate is computed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://chartmimic.github.io/static/data/benchmark.json";
const board: Leaderboard = {
  benchmark: "chartmimic",
  url: "https://chartmimic.github.io/static/data/benchmark.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const data=await fetchJson<Record<string,string|number>[]>(FEED);
    const out=data.filter(r=>typeof r.Overall==='number').map(r=>({model:String(r.Model),score:Number(r.Overall),metrics:Object.fromEntries(['Exec_Rate','Text','Layout','Type','Color','Avg','GPT-4o'].filter(k=>typeof r[k]==='number').map(k=>[k,Number(r[k])]))}));
    if(!out.length)throw new Error('ChartMimic Overall missing');return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
