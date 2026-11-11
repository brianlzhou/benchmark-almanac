// WorldAuditBench: the official Overall success percentage across five anomaly families.
// VLM-only and VLA-VLM are whole-suite agent configurations. The source reports cost in dollars per task.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const FEED = "https://ucsb-nlp-chang.github.io/WorldAuditBench/assets/app.js";
const board: Leaderboard = {
  benchmark: "worldauditbench",
  url: "https://ucsb-nlp-chang.github.io/WorldAuditBench/assets/app.js",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const m=/\[\{name:"[^"]+",logo:"[^"]+",vlm:\[/.exec(s);
    if(!m)throw new Error('WorldAuditBench results missing');
    const rows=jsLiteral<any[]>(s.slice(m.index).replace(/([,:\[])\.(\d)/g, '$10.$2'),0);
    return rows.flatMap(r=>['vlm','vla'].map(mode=>({model:r.name,score:r[mode][5],harness:mode==='vlm'?'VLM-only':'VLA-VLM',cost:r[mode][6],metrics:Object.fromEntries(r[mode].slice(0,5).map((v:number,i:number)=>['family'+(i+1),v]))})));
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
