// 1X's default README leaderboard reports temporally teacher-forced cross-entropy loss on val_v1.1.
// The catalog must change unit from percent to loss and direction to lower before these rows are used.
// Token accuracy, LPIPS and seconds per frame remain secondary metrics. Compression is the default view.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/1x-technologies/1xgpt/main/README.md";
const board: Leaderboard = {
  benchmark: "1x-world-model-challenge",
  url: "https://github.com/1x-technologies/1xgpt#leaderboard",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.includes('CE Loss')));
    if(!t)throw new Error('Compression board missing');
    return t.slice(1).map(r=>({model:r[0].text.replace(/\s*\(.*$/,''),score:num(r[1].text)!,setting:'maskgit_steps 2',metrics:{tokenAccuracy:num(r[2].text)!*100,lpips:num(r[3].text)!,secondsPerFrame:num(r[4].text)!}}));
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
