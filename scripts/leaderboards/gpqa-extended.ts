// GPQA Extended: the authors' analysis notebook publishes full-set accuracy for thirteen baselines.
// Read the saved HTML output, never execute notebook code. The notebook removes few-shot examples
// from each evaluation split. Main and Diamond scores remain metrics, not Extended rows.
// GPT-4 has no dated checkpoint in the notebook and stays unlisted. GPT-3.5 names retain 16K and 0613.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const FEED='https://raw.githubusercontent.com/idavidrein/gpqa/main/GPQA_Analysis.ipynb';
interface Notebook { cells: { source?: string[]; outputs?: { data?: { 'text/html'?: string[] | string } }[] }[] }
const board:Leaderboard={
  benchmark:'gpqa-extended',url:'https://github.com/idavidrein/gpqa',feed:FEED+' (saved full-set baseline table)',
  terms:'The GPQA repository publishes this analysis notebook under its MIT license. Benchmark Almanac credits and links the authors.',
  async fetch():Promise<LeaderboardRow[]> {
    const data=await fetchJson<Notebook>(FEED);
    for(const cell of data.cells){
      if(!cell.source?.join('').includes("baseline_results.columns = ['full-set', 'main-set', 'diamond-set']"))continue;
      for(const output of cell.outputs??[]){
        const value=output.data?.['text/html'];
        if(!value)continue;
        const table=tables(Array.isArray(value)?value.join(''):value).find(t=>t[0]?.[1]?.text==='full-set');
        if(!table)continue;
        return table.slice(1).map(r=>{
          const label=r[0].text;
          const model=label.includes('GPT-3.5')?'gpt-3.5-turbo-16k-0613':label.includes('Llama')?'Llama-2-70B-chat':'GPT-4 (snapshot unspecified)';
          const setting=label.includes('with search')?'with search':label.replace(/\s+(?:GPT|Llama).*$/,'');
          const score=num(r[1].text);
          if(score===undefined)throw new Error('GPQA Extended baseline score missing');
          return {model,score,setting,metrics:{main:num(r[2].text)!,diamond:num(r[3].text)!}};
        });
      }
    }
    throw new Error('GPQA Extended published baseline table missing');
  },
};
export default board;
