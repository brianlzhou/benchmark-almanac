// Happy World Arena's default board is Video World Model, stored as worldModel.
// The official bundle sets DEFAULT_BATTLE_TAB to worldModel. Its Elo is the headline score.
// Embodied and spatial reconstruction are separate boards and are not additional benchmark rows.
// The importer discovers the current application bundle from the page on every refresh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://aiarena.alibaba-inc.com/sla/arena/happyworld?isInternalSite=false&isIframe=true";
const board: Leaderboard = {
  benchmark: "happyworld-bench",
  url: "https://skyeval.com/sla/arena/happyworld",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const html=await fetchText(FEED);
    const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>new URL(m[1],FEED).href);
    const script=scripts.find(u=>u.includes('g.alicdn.com/dt-ai-data/arena/') && /index.*\.js/.test(u));
    if(!script)throw new Error('Arena data bundle missing');
    const source=(await fetchText(script)).replace(/`([^`]*?)`/g,(_,s)=>JSON.stringify(s));
    const rows=jsonAfter(source,'var WORLD_MODEL_LEADERBOARD_ROWS=') as any[][];
    return rows.map(r=>({model:r[1],score:r[5],metrics:{votes:r[3],winRate:r[6]}}));
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
