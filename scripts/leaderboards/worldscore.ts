// WorldScore's official leaderboard defaults to WorldScore-Static, sorted descending.
// The source script sets currentSortCol to WorldScore-Static. Dynamic scores remain secondary metrics.
// Source: https://huggingface.co/spaces/Howieeeee/WorldScore_Leaderboard/raw/main/script.js
// Only models with the default headline score produce rows. Models with only Dynamic scores do not.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/Howieeeee/WorldScore_Leaderboard/raw/main/leaderboard.csv";
const board: Leaderboard = {
  benchmark: "worldscore",
  url: "https://huggingface.co/spaces/Howieeeee/WorldScore_Leaderboard",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    return parseCsv(await fetchText(FEED)).filter(r=>num(r['WorldScore-Static'])!==undefined).map(r=>({
      model:r['Model Name'].replace(/^\[([^\]]+)\]\(.*\)$/,'$1'),score:num(r['WorldScore-Static'])!,
      metrics:Object.fromEntries(['WorldScore-Dynamic','Camera Control','Object Control','Content Alignment','3D Consistency','Photometric Consistency','Style Consistency','Subjective Quality','Motion Accuracy','Motion Magnitude','Motion Smoothness'].filter(k=>num(r[k])!==undefined).map(k=>[k.replace(/[^A-Za-z]/g,''),num(r[k])!]))
    }));
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
