// CELLO: average instruction-following score, expressed as a percentage from the official 0–1 CSV
// values. Merge task and constraint metrics by model within each named track; keep Ch_cc, Ch_fs and
// Eg separate. Fetch all six files from the current repository branch with host pacing.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/Abbey4799/CELLO/main/scores/";
const board: Leaderboard = {
 benchmark: "cello", parts: {
  extraction: { name: 'Extraction', group: 'Task type' },
  Planning: { name: 'Planning', group: 'Task type' },
  meta_prompt: { name: 'Meta prompt', group: 'Task type' },
  brainstorming_single_round: { name: 'Brainstorming single round', group: 'Task type' },
  writing_single_round: { name: 'Writing single round', group: 'Task type' },
  keywords_extraction: { name: 'Keywords extraction', group: 'Task type' },
  closed_qa: { name: 'Closed QA', group: 'Task type' },
  Summarization: { name: 'Summarization', group: 'Task type' },
  Structure: { name: 'Structure', group: 'Task type' },
  brainstorming_multi_rounds: { name: 'Brainstorming multiple rounds', group: 'Task type' },
  writing_multi_rounds: { name: 'Writing multiple rounds', group: 'Task type' },
  Ave_complex_input: { name: 'Complex input', group: 'Category' },
  format_score: { name: 'Format', group: 'Dimension' },
  input_score: { name: 'Input', group: 'Dimension' },
  task_score: { name: 'Task', group: 'Dimension' },
  Ave_complex_ins: { name: 'Complex instruction', group: 'Category', note: 'Average across extraction, planning, meta prompt, single-round brainstorming, and single-round writing.' },
}, url: "https://github.com/Abbey4799/CELLO", feed: FEED,
 terms: 'The benchmark authors publish this public feed. Their source license and site terms apply.',
 aliases: {
  'Llama2-chat-70B': 'llama-2-70b',
  'Llama2-chat-13B': 'llama-2-13b',
  'Llama2-chat-7B': 'llama-2-7b',
  'Vicuna-V1.3-13B': 'vicuna-13b-v1-3',
  ChatGLM: 'chatglm-6b',
  ChatGLM2: 'chatglm2-6b',
 },
 stats: { count_limit_score: { name: 'Count limit score', unit: '%' , better: 'higher' } },

 async fetch() {

const rows:LeaderboardRow[]=[];let first=true;
for(const track of ['Ch_cc','Ch_fs','Eg']){const models=new Map<string,LeaderboardRow>();
 for(const kind of ['tasks','constraints']){if(!first)await new Promise(r=>setTimeout(r,1100));first=false;
  const data=parseCsv(await fetchText(`${FEED}${track}_scores_by_${kind}.csv`));
  if(!data[0]||!('Average'in data[0]))throw new Error('CELLO CSV schema changed');
  for(const r of data){const score=num(r.Average);if(!r.model_name||score===undefined)continue;const old=models.get(r.model_name);if(old&&Math.abs(old.score-score*100)>0.001)throw new Error('CELLO task/constraint average mismatch');const row=old??{model:r.model_name,score:score*100,setting:track,metrics:{}};for(const [k,v]of Object.entries(r)){if(k==='model_name'||k==='Average')continue;const n=num(v);if(n!==undefined)row.metrics![k]=n*100;}models.set(r.model_name,row);}
 }
 rows.push(...models.values());
}
if(!rows.length)throw new Error('No CELLO results');return rows;
 },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
