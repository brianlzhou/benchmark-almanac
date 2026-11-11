// Spider 2.0: use the Snow leaderboard, the page's first and default tab.
// Its Score is task success percentage. DBT and Lite use different task sets and are excluded.
// Agent-plus-model submissions retain the named agent as their harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://spider2-sql.github.io/";
const board: Leaderboard = {
 benchmark: "spider-2",
 url: "https://spider2-sql.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const html=await fetchText(FEED);const rows:LeaderboardRow[]=[];
  for(const [id,split] of [['snow','Snow']]) {
    const fragment=html.match(new RegExp('<table[^>]*id="ex-table-'+id+'"[\\s\\S]*?</table>'))?.[0];
    if(!fragment)throw new Error('Spider 2.0 '+split+' table missing');
    for(const r of tables(fragment)[0].slice(1)) {
      const score=num(r[2]?.text);if(score===undefined)continue;
      const name=text(r[1].html.split(/<p\b|<span\b[^>]*class=["']affiliation["']/i)[0]);const at=name.lastIndexOf(' + ');
      rows.push({model:at>=0?name.slice(at+3):name,harness:at>=0?name.slice(0,at):undefined,score});
    }
  }
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
