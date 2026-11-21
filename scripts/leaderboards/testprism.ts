// TestPrism: Joint Success Fraction (JSF) requires all reference and candidate checks to pass.
// The paper reports JSF percentages over 300 tasks. Individual acceptance and coverage metrics stay secondary.
// The appendix adds coding-agent configurations. The TestHelix table gives whole-set ablation scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2610.12289";
const board: Leaderboard = {
  benchmark: "testprism", static: 'paper',
  url: "https://arxiv.org/html/2610.12289",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  stats: {
    RAR: { name: 'Reference acceptance rate', unit: '%', better: 'higher' },
    VAR: { name: 'Verifier acceptance rate', unit: '%', better: 'higher' },
    IRR: { name: 'Instruction recovery rate', unit: '%', better: 'higher' },
    H: { name: 'Helpfulness', unit: '%', better: 'higher' },
    coverage: { name: 'Coverage', unit: '%', better: 'higher' },
    EC: { name: 'Error consistency', unit: '%', better: 'higher' },
  },
  
  async fetch() {
    const all=tables(await fetchText(FEED));const results=all.filter(t=>t[0]?.some(c=>c.text==='Joint') && t[1]?.some(c=>c.text==='JSF'));
    if(!results.length)throw new Error('TestPrism JSF table missing');
    const rows: LeaderboardRow[] = results.flatMap(t=>t.slice(2).map(r=>({
      model:r[0].text,score:num(r[7].text)!,setting:r[0].text.match(/-(max|low)$/)?.[1],
      metrics:Object.fromEntries(['RAR','VAR','IRR','H','coverage','EC'].map((k,i)=>[k,num(r[i+1].text)!]))
    })));
    const ablations=all.find(t=>t[0]?.[0]?.text==='Setting' && t[1]?.some(c=>c.text==='PCV'));
    for(const r of ablations?.slice(2) ?? []) {
      if(r[0].text==='Native agent') {
        for(const [index,label] of [[0,'GPT 5.6 sol -max'],[1,'Kimi K3']] as const){
          const native=rows.find(x=>x.model===label && x.score===num(r[5+5*index].text));
          if(native)native.harness='Native agent';
        }
        continue;
      }
      for(const [index,model] of ['GPT 5.6 sol','Kimi K3'].entries()){
        const start=3+5*index;
        rows.push({model,harness:'TestHelix',setting:`HS ${r[0].text}, PCV ${r[1].text}, RSI ${r[2].text}`,
          score:num(r[start+4].text)!,metrics:Object.fromEntries(['RAR','VAR','IRR','H'].map((k,i)=>[k,num(r[start+i].text)!]))});
      }
    }
    return rows;
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
