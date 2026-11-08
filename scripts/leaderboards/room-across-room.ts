// RxR: the paper’s Test-Std average nDTW across all three languages.
// nDTW measures route fidelity. Success and success-weighted DTW remain metrics.
// Mono and Multi identify the paper’s navigation baselines, not general-purpose language models.
// These rows are the paper’s static results. They will not refresh with later model evaluations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2010.07954";
const board: Leaderboard = {
  benchmark: "room-across-room",
  url: "https://arxiv.org/html/2010.07954",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[1]?.[0]?.text==='Split'&&t[1]?.[1]?.text==='Method');
    if(!t)throw new Error('RxR test table missing');let split='';const out:LeaderboardRow[]=[];
    for(const r of t.slice(2)){if(r[0].text)split=r[0].text;if(split!=='Test-Std'||!['Mono','Multi'].includes(r[1].text))continue;
      out.push({model:'RxR '+r[1].text,score:num(r[21].text)!,metrics:{successRate:num(r[11].text)!,successDTW:num(r[16].text)!}});
    }return out;
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
