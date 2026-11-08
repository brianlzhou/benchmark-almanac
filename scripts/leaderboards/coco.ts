// COCO defaults to BBOX Dev (bbox_dev2015), ranked by AP averaged over IoU thresholds 0.50 through 0.95. Fractions become percentages. Segmentation and other years are separate views. Repeated submission names keep their latest submission.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://cocodataset.org/leaderboard/bbox_dev2015.json";
const board: Leaderboard = {
  benchmark: "coco",
  url: "https://cocodataset.org/#detection-leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=await fetchJson<any[]>(FEED);const keep=new Map<string,LeaderboardRow>();
for(const r of [...d].sort((a,b)=>a.date.localeCompare(b.date))){const m=JSON.parse(r.results);if(typeof m.AP!=='number')throw new Error('Missing detection AP');keep.set(r.team.name,{model:r.team.name,score:100*m.AP,date:r.date,metrics:Object.fromEntries(Object.entries(m).filter(([k,v])=>k!=='AP'&&typeof v==='number').map(([k,v])=>[k,100*(v as number)]))});}return [...keep.values()];

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
