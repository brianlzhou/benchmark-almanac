// JailbreakBench reports attack success rate over its harmful-behavior set.
// Attack method, defense and threat model are whole-benchmark configurations, not task subsets.
// The catalog's benign behaviors are used for other metrics, not the ASR denominator.
// Artifact links identify Vicuna v1.5 and Llama 2 Chat snapshots. Undated closed models stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://jailbreakbench.github.io/tables/table_open_source.html";
const board: Leaderboard = {
  benchmark: "jailbreakbench",
  url: "https://jailbreakbench.github.io/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const feeds=[FEED,'https://jailbreakbench.github.io/tables/table_closed_source.html'];
    const out:LeaderboardRow[]=[];
    for(const [i,feed] of feeds.entries()){
      if(i)await new Promise(r=>setTimeout(r,1100));
      const ts=tables(await fetchText(feed));
      for(const t of ts)for(const r of t.slice(1)){
        const c=r.map(x=>x.text),score=num(c[8]);if(score===undefined)continue;
        let model=c[1];const html=r.map(x=>x.html).join(' ');
        if(model==='Vicuna-13B' && html.includes('vicuna-13b-v1.5'))model='Vicuna-13B-v1.5';
        if(model==='Llama-2-7B' && html.includes('llama-2-7b-chat-hf'))model='Llama-2-7B-Chat';
        if(/^(GPT-4|GPT-3.5-Turbo)$/i.test(model))model+=' (snapshot unspecified)';
        const queries=num(c[7]);
        out.push({model,score,setting:'Defense: '+c[2]+'; '+c[5],harness:c[4],
          ...(queries===undefined?{}:{metrics:{averageQueries:queries*(/k/i.test(c[7])?1000:1)}})});
      }
    }
    if(!out.length)throw new Error('ASR tables missing');return out;
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
