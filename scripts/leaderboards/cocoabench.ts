// CocoaBench: overall published task score from official chart data.
// Existing agents and Cocoa-Agent configurations retain their harness. Unknown product backbones remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://cocoabench.github.io/assets/js/chart.js";
const board: Leaderboard = {
  benchmark: "cocoabench",
  url: "https://cocoabench.github.io/assets/js/chart.js",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=(await fetchText(FEED)).replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g,(_,v)=>JSON.stringify(v));const read=(k:string)=>jsLiteral<any[]>(s,s.indexOf('[',s.indexOf('const '+k+' =')));return [...read('EXISTING_AGENTS').map(r=>({model:r.sub||r.name,harness:r.sub?r.name:undefined,score:r.score})),...read('COCOA_AGENTS').map(r=>({model:r.name,harness:'Cocoa-Agent',score:r.score}))];
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
