// XTREME: avgAllScoreString is the board’s published whole-suite score.
// Four task-family averages remain metrics. The importer reads scalar literals without executing the application.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://sites.research.google/xtreme/app.js";
const board: Leaderboard = {
  benchmark: "xtreme",
  url: "https://sites.research.google/xtreme/app.js",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const out:LeaderboardRow[]=[];
    for(const m of s.matchAll(/modelName:"([^"\\]*)",\s*timestampMicros:\d+,\s*date:"([^"\\]*)",\s*referenceLink:"[^"\\]*",\s*avgAllScoreString:"([\d.]+)",\s*avgSpcScoreString:"([\d.]+)",\s*avgSpScoreString:"([\d.]+)",\s*avgQaScoreString:"([\d.]+)",\s*avgSrScoreString:"([\d.]+)"/g)){
      if(!m[1])continue;out.push({model:m[1],score:Number(m[3]),metrics:{sentenceClassification:Number(m[4]),structuredPrediction:Number(m[5]),questionAnswering:Number(m[6]),sentenceRetrieval:Number(m[7])}});
    }if(!out.length)throw new Error('XTREME rows missing');return out;
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
