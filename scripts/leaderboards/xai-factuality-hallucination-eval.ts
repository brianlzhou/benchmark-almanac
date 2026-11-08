// xAI's Grok 4.1 launch article publishes the Hallucination Rate chart as embedded JSON.
// The score is the macro-average percentage of atomic claims with major or minor errors.
// Lower is better. Both models use non-reasoning mode and web search. FActScore is a separate benchmark.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://x.ai/news/grok-4-1";
const board: Leaderboard = {
  benchmark: "xai-factuality-hallucination-eval",
  url: "https://x.ai/news/grok-4-1",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const html=await fetchText(FEED);
    let source=html;
    for(const m of html.matchAll(/self\.__next_f\.push\(\[1,((?:"(?:\\.|[^"\\])*")).*?\]\)/g)) {
      try { source += '\n' + JSON.parse(m[1]); } catch {}
    }
    const hit=source.match(/"benchmark":"Hallucination Rate","domain":\[[^\]]+\],"unit":"%","data":(\[[^\]]+\])/);
    if(!hit) throw new Error('Hallucination Rate chart missing');
    return JSON.parse(hit[1]).map((r:any)=>({model:r.model.replace(/ \(Non-Reasoning\)$/,''),score:r.score,setting:'Non-reasoning, web search'}));
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
