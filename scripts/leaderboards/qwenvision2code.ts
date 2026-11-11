// QwenVision2Code: Qwen’s maker-published comparison table.
// The article API returns the same HTML shown on the public blog. Scores use the published whole-benchmark row.
// Undated DeepSeek labels remain unlisted. Reasoning modes distinguish whole-benchmark runs.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://qwen.ai/api/v2/article/?language=en-US&path=qwen3.7-plus&type=qwen_ai";
const board: Leaderboard = {
  benchmark: "qwenvision2code",
  url: "https://qwen.ai/blog?id=qwen3.7-plus",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const page=(await fetchJson<any>(FEED)).data.content;
    const t=tables(page).find(t=>t.some(r=>r[0]?.text==='QwenVision2Code'));
    if(!t)throw new Error('Qwen benchmark row missing');const row=t.find(r=>r[0]?.text==='QwenVision2Code')!;
    const names:Record<string,string>={'Opus4.8':'Claude Opus 4.8','Fable5':'Claude Fable 5','Opus-4.6':'Claude Opus 4.6','K2.6':'Kimi K2.6','DeepSeek-V4-Pro':'DeepSeek V4 Pro (snapshot unspecified)','GPT5.6 Sol':'GPT-5.6-Sol','Gemini-3.1 Pro':'Gemini 3.1 Pro'};
    return row.slice(1).flatMap((c,i)=>{const score=num(c.text);if(score===undefined)return [];
      const label=t[0][i+1].text;const setting=label.match(/\s+\(?(max|thinking|xhigh)\)?$/i)?.[1].toLowerCase();
      const raw=label.replace(/\s+\(?(max|thinking|xhigh)\)?$/i,'');return [{model:names[raw]??raw,score,setting}];});
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
