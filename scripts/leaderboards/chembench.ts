// ChemBench: version 2.0.2 whole-benchmark overall_score, converted from a fraction to percent.
// Verification and tool use describe full runs. Token metadata describes training, not inference usage.
// Page through all records and retain unlisted models and agent names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://datasets-server.huggingface.co/rows?dataset=jablonkagroup%2FChemBench-Results&config=default&split=2.0.2&offset=0&length=100";
const board: Leaderboard = {
  benchmark: "chembench",
  url: "https://datasets-server.huggingface.co/rows?dataset=jablonkagroup%2FChemBench-Results&config=default&split=2.0.2&offset=0&length=100",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  aliases: {'gemini-2.5-flash-preview-04-17':'gemini-2-5-flash-apr-2025'},
  async fetch() {
    const out:LeaderboardRow[]=[];let offset=0,total=Infinity;
    while(offset<total){
      if(offset)await new Promise(r=>setTimeout(r,2100));
      type Page = {rows:{row:Record<string,unknown>}[];num_rows_total:number};
      let d: Page;
      try {
        d = await fetchJson<Page>(FEED.replace('offset=0',`offset=${offset}`));
      } catch (error) {
        if (offset) throw error;
        // The rows endpoint sometimes rate-limits while the cached first-rows endpoint remains available.
        // Check the dataset's independent size metadata so a preview can never truncate the leaderboard.
        await new Promise(r=>setTimeout(r,2100));
        const size = await fetchJson<{partial:boolean;size:{splits:{config:string;split:string;num_rows:number}[]}}>('https://datasets-server.huggingface.co/size?dataset=jablonkagroup%2FChemBench-Results');
        const expected = size.size.splits.find(s=>s.config==='default'&&s.split==='2.0.2')?.num_rows;
        await new Promise(r=>setTimeout(r,2100));
        const first = await fetchJson<{rows:Page['rows'];truncated:boolean}>('https://datasets-server.huggingface.co/first-rows?dataset=jablonkagroup%2FChemBench-Results&config=default&split=2.0.2');
        if (size.partial || first.truncated || expected !== first.rows.length) throw new Error('ChemBench fallback does not contain the complete split');
        d = {rows:first.rows,num_rows_total:expected};
      }
      total=d.num_rows_total;
      if(!d.rows.length)throw new Error('ChemBench pagination ended early');
      for(const {row:r} of d.rows){
        if(typeof r.overall_score!=='number')continue;
        const metrics:Record<string,number>={};
        for(const k of ['Analytical Chemistry','Chemical Preference','General Chemistry','Inorganic Chemistry','Materials Science','Organic Chemistry','Physical Chemistry','Technical Chemistry','Toxicity and Safety'])if(typeof r[k]==='number')metrics[k]=Number(r[k])*100;
        out.push({model:String(r.name),score:r.overall_score*100,setting:`${r.verified?'verified':'self-reported'}, ${r.tool_use?'tools':'no tools'}`,harness:r.uses_harness&&r.harness_description?String(r.harness_description):undefined,metrics});
      }offset+=d.rows.length;
    }return out;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  if (r.model === 'Claude-3.5 (Sonnet)') return {...r, model: 'Claude 3.5 Sonnet (snapshot unspecified)'};
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
