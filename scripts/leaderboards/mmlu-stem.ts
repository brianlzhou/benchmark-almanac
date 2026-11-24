// MMLU-STEM: the official MMLU Test Leaderboard STEM accuracy percentage, not its overall average.
// Preserve model-size and few-shot/fine-tuning configurations; exclude the random baseline.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://raw.githubusercontent.com/hendrycks/test/master/README.md";
const board: Leaderboard = {
 benchmark: "mmlu-stem", url: "https://github.com/hendrycks/test", feed: FEED,
 terms: 'The benchmark authors publish this public feed. Their source license and site terms apply.',
 aliases: {
  'Chinchilla (70B, few-shot)': 'chinchilla',
  'Gopher (280B, few-shot)': 'gopher-280b',
  'GPT-3 (175B, few-shot)': 'gpt-3-175b-davinci',
  'GPT-3 (175B, fine-tuned)': 'gpt-3-175b-davinci',
  'GPT-3 (6.7B, fine-tuned)': 'gpt-3-6-7b',
  'GPT-2': 'gpt-2-1-5b',
 },

 async fetch() {

const t=mdTables(await fetchText(FEED)).find(t=>t.head.includes('STEM'));if(!t)throw new Error('MMLU STEM table missing');const i=t.head.indexOf('STEM');return t.rows.flatMap(r=>{if(/^Random/i.test(r[0]))return[];const score=num(r[i]);if(score===undefined)return[];const config=r[0].match(/\(([^)]+)\)$/)?.[1];return [{model:r[0],score,setting:config}];});
 },
};
export default board;
