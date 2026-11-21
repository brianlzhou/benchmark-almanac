// TMMLU+ evaluates multilingual multiple-choice knowledge in Simplified and Traditional Chinese.
// Table 4 reports zero-shot average accuracy for seven named models in both prompt variants.
// The Simplified Chinese average is the headline and the Traditional Chinese average remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/pdf/2403.01858';
const board:Leaderboard={benchmark:'tmmlu-plus',static:'paper',url:'https://arxiv.org/abs/2403.01858',feed,terms:'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2403.01858',async fetch():Promise<LeaderboardRow[]>{const t=await pdfText(feed);if(!t.includes('Table 4: Comparative Results on TMMLU+'))throw Error('TMMLU+ Table 4 missing');const v=[['GPT-3.5-turbo',41.9,41.8],['Gemini-pro',51.5,49.9],['Qwen-14B',51.3,50.5],['Qwen-7B',42.1,40.0],['Breeze-7B-Instruct-v1.0',35.7,36.1],['Taiwan-LLaMa-13B',16.0,21.3],['Taiwan-LLaMa-7B',15.9,15.6]] as const;return checked(v.map(([model,simplified,traditional])=>({model,score:simplified,metrics:{simplified,traditional}})),7)}};export default board;
