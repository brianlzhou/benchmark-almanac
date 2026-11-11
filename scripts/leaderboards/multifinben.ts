// The current Open-FinLLM Space publishes MultiFinBen, distinct from the original FinBen.
// Use its published modality-balanced score. The site's zero scores include unsupported modalities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const url='https://huggingface.co/spaces/TheFinAI/Open-FinLLM-Leaderboard';
const board:Leaderboard={benchmark:'multifinben',url,feed:`${url}/raw/main/scores.json`,
 terms:'The FinAI publicly publishes these scores in its Space. The Almanac credits and links the original authors.',
 aliases:{'Llama-4-Scout-17B-16E':'llama-4-scout'},
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<{models:{name:string;balanced:number;text:number;vision:number;audio:number;scores:Record<string,number>}[]}>(`${url}/raw/main/scores.json`);
  const rows=d.models.filter(m=>Number.isFinite(m.balanced)).map(m=>({model:/^(GPT-4o|GPT-4o-mini|DeepSeek-V3|Gemini-?1[.]5-?(Pro|Flash))$/i.test(m.name)?`${m.name} [snapshot unspecified]`:m.name,score:m.balanced,metrics:{...m.scores,text:m.text,vision:m.vision,audio:m.audio}}));
  if(!rows.length)throw new Error('MultiFinBen model rows missing');return rows;
 }
};export default board;
