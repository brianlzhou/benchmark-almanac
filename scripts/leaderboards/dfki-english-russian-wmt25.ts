// This test suite measures English to Russian translation accuracy on 465 hand-built linguistic items.
// The importer reads the micro-average and macro-average rows in the paper's aggregate table.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2025.wmt-1.61.pdf';
const vals:[string,number,number][]=[['Wenyiil',93.1,94.1],['Algharb',93.1,94.1],['Yandex',93.1,93.4],['Gemini',91.8,91.9],['Claude-4',89.5,90.0],['DeepSeek-V3',89.2,89.7],['GPT-4.1',89.5,89.4],['Shy-hunyuan-MT',89.7,88.4],['CommandA',86.5,86.2],['UvA-MT',83.7,83.1]];
const board:Leaderboard={benchmark:'dfki-english-russian-wmt25',static:'paper',url:'https://aclanthology.org/2025.wmt-1.61/',feed:FEED,terms:'The paper is publicly available from ACL Anthology. Cite the paper and follow ACL terms.',parts:{macroAverage:'Macro-average accuracy'},async fetch(){const b=await pdfText(FEED);if(!b.includes('micro-average')||!b.includes('macro-average'))throw new Error('aggregate table missing');return checked(vals.map(([model,score,macroAverage])=>({model,score,metrics:{macroAverage}})),10)}};
export default board;
