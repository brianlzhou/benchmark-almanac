// CodeXGLUE: the official overall board’s CodeXGLUE Score.
// Task boards cannot become separate rows on the suite. The ten published task columns remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://microsoft.github.io/CodeXGLUE/webpage_files/participants/overall.json";
const board: Leaderboard = {
  benchmark: "codexglue",
  url: "https://microsoft.github.io/CodeXGLUE/webpage_files/participants/overall.json",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const d=await fetchJson<{data:Record<string,string|number>[]}>(FEED);
    return d.data.filter(r=>typeof r['CodeXGLUE Score']==='number').map(r=>({model:String(r.Model),score:Number(r['CodeXGLUE Score']),date:String(r['Submission Date']),metrics:Object.fromEntries(['clone detection','defect detection','cloze test','code completion','code refinement','code translation','natural language code search','code generation','code summarization','documentation translation'].filter(k=>r[k]!==undefined).map(k=>[k,Number(r[k])]))}));
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
