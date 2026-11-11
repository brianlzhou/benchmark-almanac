// COCO defaults to the C5 captioning board, ranked by CIDEr-D. Raw CIDEr-D is multiplied by 100 to match this catalog record and its lab results. Source submission names identify systems and remain unlisted. Empty names are excluded. Repeated names keep their latest submission. C40 and human challenge metrics are different views.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://cocodataset.org/leaderboard/cap_c5.json";
const board: Leaderboard = {
  benchmark: "coco-captions",
  url: "https://cocodataset.org/#captions-leaderboard",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=await fetchJson<any[]>(FEED);const keep=new Map<string,LeaderboardRow>();
for(const r of [...d].sort((a,b)=>a.date.localeCompare(b.date))){const model=text(text(r.team.name));if(!model)continue;const m=JSON.parse(r.results);if(typeof m.CIDEr!=='number')throw new Error('Missing CIDEr');keep.set(model,{model,score:100*m.CIDEr,date:r.date,metrics:Object.fromEntries(Object.entries(m).filter(([k,v])=>k!=='CIDEr'&&typeof v==='number').map(([k,v])=>[k,100*(v as number)]))});}return [...keep.values()];

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
