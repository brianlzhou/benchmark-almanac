// WorldExam has separate tracks without a combined score. Use the official default
// Dynamic-Interaction Track Overall score (native 0-100), selected by the active panel.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://worldexam.github.io/";
const board: Leaderboard = {
  benchmark: "worldexam", url: "https://worldexam.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const active=source.match(/class="leaderboard-panel active"\s+data-board-panel="([^"]+)"/);
    if(!active)throw new Error('WorldExam default panel missing');
    const all = tables(source.slice(active.index)).slice(0,1).map(t => t.map(r => r.map(c => c.text)));
    const rows: LeaderboardRow[] = [];
    let split=0;for(const t of all){if(t[0]?.[1]!=="Model"||t[0]?.[2]!=="Average")continue;const setting=++split===1?"First person":"Third person",h=t[1];for(const r of t.slice(2)){const score=num(r[2]);if(score===undefined)continue;const metrics:Record<string,number>={};for(let i=3;i<r.length;i++){const n=num(r[i]);if(n!==undefined)metrics[h[i-2].replace(/ ↕$/,"")]=n;}rows.push({model:r[1],score,metrics});}}
    if (!rows.length) throw new Error("No worldexam score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

