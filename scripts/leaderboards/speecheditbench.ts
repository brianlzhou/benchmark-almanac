// SpeechEditBench evaluates instruction-guided speech editing across seven editing dimensions.
// The paper's Table 2 reports joint success percentages, with target success in parentheses.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2026.emnlp-main.1151.pdf';
const rows=[
 ['Ming-UniAudio',76.46,{emotion:3.43,style:22.17,prosody:26.50,paralinguistic:11.25,acoustic:25.85,compositional:1.75}],
 ['Step-Audio-EditX',16.50,{emotion:7.71,style:49.67,prosody:20.13,paralinguistic:31.25,acoustic:22.89,compositional:2.00}],
 ['Qwen3-Omni',72.00,{emotion:1.64,style:24.17,prosody:38.17,paralinguistic:14.50,acoustic:37.80,compositional:5.00}],
 ['Kimi-Audio',34.67,{emotion:2.36,style:24.50,prosody:13.50,paralinguistic:9.25,acoustic:8.25,compositional:1.50}],
 ['Mimo-Audio-Base',31.67,{emotion:.21,style:5.83,prosody:5.67,paralinguistic:1.00,acoustic:4.44,compositional:1.75}],
 ['Mimo-Audio-Instruction',64.17,{emotion:.86,style:.50,prosody:.67,paralinguistic:2.00,acoustic:.80,compositional:7.25}],
 ['Gemini-Live',93.17,{emotion:27.79,style:63.67,prosody:65.17,paralinguistic:26.50,acoustic:36.69,compositional:11.00}],
 ['GPT-Realtime',96.67,{emotion:14.57,style:68.67,prosody:63.94,paralinguistic:47.00,acoustic:27.60,compositional:10.00}],
] as const;
const board:Leaderboard={benchmark:'speecheditbench',static:'paper',url:'https://aclanthology.org/2026.emnlp-main.1151/',feed:FEED,terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',headline:'The paper reports no overall score, so this is the content-editing joint-success column, which it presents first.',parts:{content:{name:'Content'},emotion:{name:'Emotion'},style:{name:'Style'},prosody:{name:'Prosody'},paralinguistic:{name:'Paralinguistic'},acoustic:{name:'Acoustic'},compositional:{name:'Compositional'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 2: SpeechEditBench main results'))throw Error('SpeechEditBench Table 2 missing');return checked(rows.map(([model,score,metrics])=>({model,score,metrics})),8)}};
export default board;
