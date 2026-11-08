// BrowseComp-Plus: official whole-benchmark accuracy. The retriever is a harness configuration.
// The page embeds the table as fallbackData. Recall, search calls and calibration error remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://texttron.github.io/BrowseComp-Plus/";
const board: Leaderboard = {
  benchmark: "browsecomp-plus",
  url: "https://texttron.github.io/BrowseComp-Plus/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=await fetchText(FEED); const block=s.match(/const fallbackData\s*=\s*(\[[\s\S]*?\n\s*\]);/);
      if(!block)throw new Error('BrowseComp Plus table missing');
      const data=jsLiteral(block[1].replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g,(_,v)=>JSON.stringify(v)),0) as string[][];
      return data.map(r=>({model:r[0]==='oss-120B-high'?'gpt-oss-120b':r[0],setting:r[0]==='oss-120B-high'?'high':undefined,harness:r[1],score:num(r[2])!,metrics:Object.fromEntries([['recall',num(r[3])],['searchCalls',num(r[4])],['calibrationError',num(r[5])]].filter(x=>typeof x[1]==='number'))}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
