// OpenAI's launch table publishes Management Consulting Tasks accuracy in percent.
// Select this exact row; other evaluations in the same table are not imported.
import type { Leaderboard } from './types.ts';
import { openaiHtml } from '../lib/boards/openai-cov8.ts';
import { tables, num } from '../lib/html.ts';
const URL='https://openai.com/index/gpt-5-6/';
const board:Leaderboard={benchmark:'management-consulting-tasks-openai',url:URL,feed:URL,
 terms:'OpenAI terms restrict automated extraction; Benchmark Almanac credits OpenAI and links the source.',
 async fetch(){for(const t of tables(await openaiHtml(URL))){const row=t.find(r=>r[0]?.text==='Management Consulting Tasks (Internal)');if(!row)continue;return row.slice(1).flatMap((c,i)=>{const score=num(c.text);return score===undefined?[]:[{model:t[0][i+1].text.replace(/‑/g,'-'),score}];});}throw new Error('Management consulting table missing');}};
export default board;
