// TheAgentCompany: headline percent resolved, over all 175 company tasks.
// Partial checkpoint score and average steps are metrics. Costs are dollars per task. The current page supplies the bundle URL.
// The November 2025 DeepSeek-V3.2 label predates its named stable release. It remains unlisted because the source does not identify Exp.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://the-agent-company.com/";
const board: Leaderboard = {
  benchmark: "theagentcompany",
  url: "https://the-agent-company.com/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const page=await fetchText(FEED);const path=page.match(/src="([^" ]*main\.[^" ]+\.js)"/)?.[1];
      if(!path) throw new Error('TheAgentCompany bundle missing');
      await new Promise(r=>setTimeout(r,1100));const s=await fetchText(new URL(path,FEED).href);
      const literal=[...s.matchAll(/JSON\.parse\('((?:[^'\\]|\\.)*)'\)/g)].find(m=>m[1].includes('"resolved"'))?.[1];
      if(!literal) throw new Error('TheAgentCompany results missing');
      const data=JSON.parse(literal.replace(/\\'/g,"'"));
      return data.G.map((r:any)=>{const p=r.model.split(' + ');return {model:(()=>{const name=p.pop();return /^Deepseek-V3.2$/i.test(name)&&r.date<'2025-12-01'?name+' (snapshot unspecified)':name;})(),harness:p.join(' + ')||undefined,score:r.resolved,date:r.date,cost:r.costs,metrics:{partialScore:r.score,...(typeof r.steps==='number'?{steps:r.steps}:{})}};});
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
