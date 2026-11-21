// The current Open-FinLLM Space publishes MultiFinBen, distinct from the original FinBen.
// Keep weight access, modality configuration, and the published modality-balanced score. The site's zero scores include unsupported modalities.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const url='https://huggingface.co/spaces/TheFinAI/Open-FinLLM-Leaderboard';
const board:Leaderboard={benchmark:'multifinben', parts: {
  finred: { name: 'FinRED', group: 'Split' },
  finer_ord: { name: 'FinER-ORD', group: 'Split' },
  headlines: { name: 'Headlines', group: 'Split' },
  xbrl_math: { name: 'XBRL Math', group: 'Split' },
  finqa: { name: 'FinQA', group: 'Split' },
  tatqa: { name: 'TAT-QA', group: 'Split' },
  ectsum: { name: 'ECTSum', group: 'Split' },
  edtsum: { name: 'EDTSum', group: 'Split' },
  bigdata22: { name: 'BigData22', group: 'Split' },
  financialiq: { name: 'FinancialIQ', group: 'Split' },
  chabsa: { name: 'CHABSA', group: 'Split' },
  multifin: { name: 'MultiFin', group: 'Split' },
  fns_2023: { name: 'FNS 2023', group: 'Split' },
  grfinnum: { name: 'GRFinNum', group: 'Split' },
  grfinqa: { name: 'GRFinQA', group: 'Split' },
  grfns_2023: { name: 'GRFNS 2023', group: 'Split' },
  grmultifin: { name: 'GRMultiFin', group: 'Split' },
  dolfin: { name: 'DOLFIN', group: 'Split' },
  polyfiqa_easy: { name: 'PolyFiQA easy', group: 'Split' },
  polyfiqa_expert: { name: 'PolyFiQA expert', group: 'Split' },
  englishocr: { name: 'English OCR', group: 'Split' },
  tablebench: { name: 'TableBench', group: 'Split' },
  japaneseocr: { name: 'Japanese OCR', group: 'Split' },
  spanishocr: { name: 'Spanish OCR', group: 'Split' },
  greekocr: { name: 'Greek OCR', group: 'Split' },
  finaudiosum: { name: 'FinAudioSum', group: 'Split' },
  text: { name: 'Text', group: 'Modality' },
  vision: { name: 'Vision', group: 'Modality' },
  audio: { name: 'Audio', group: 'Modality' },
  sc: { name: 'Causal classification', group: 'Split', note: 'The SC dataset detects causal statements in financial text.' },
  tsa_en: { name: 'English sentiment analysis', group: 'Split' },
  tsa_es: { name: 'Spanish sentiment analysis', group: 'Split' },
  rre: { name: 'Relation extraction', group: 'Split', note: 'Relations between audit entities in Chinese regulatory text.' },
},url,feed:`${url}/raw/main/scores.json`,
 terms:'The FinAI publicly publishes these scores in its Space. The Almanac credits and links the original authors.',
 aliases:{'Llama-4-Scout-17B-16E':'llama-4-scout'},
 async fetch():Promise<LeaderboardRow[]>{
  const d=await fetchJson<{models:{name:string;closed?:boolean;group?:string;balanced:number;text:number;vision:number;audio:number;scores:Record<string,number>}[]}>(`${url}/raw/main/scores.json`);
  const rows=d.models.filter(m=>Number.isFinite(m.balanced)).map(m=>({model:/^(GPT-4o|GPT-4o-mini|DeepSeek-V3|Gemini-?1[.]5-?(Pro|Flash))$/i.test(m.name)?`${m.name} [snapshot unspecified]`:m.name,score:m.balanced,open:typeof m.closed === 'boolean' ? !m.closed : undefined,setting:m.group || undefined,metrics:{...m.scores,text:m.text,vision:m.vision,audio:m.audio}}));
  if(!rows.length)throw new Error('MultiFinBen model rows missing');return rows;
 }
};export default board;
