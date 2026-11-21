// This benchmark is the 2023 Taiwan national dental technician licensing examination.
// Table 1 of the paper reports overall answer accuracy for three models over four repeat sessions.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://pmc.ncbi.nlm.nih.gov/articles/PMC12485393/';
const vals=[
 ['ChatGPT-4','initial',52.1],['ChatGPT-4','post-one week',56.2],['ChatGPT-4','post-two weeks',56.2],['ChatGPT-4','post-three weeks',52.1],
 ['Gemini','initial',57.2],['Gemini','post-one week',67.0],['Gemini','post-two weeks',66.0],['Gemini','post-three weeks',67.0],
 ['DeepSeek-V3','initial',69.6],['DeepSeek-V3','post-one week',72.7],['DeepSeek-V3','post-two weeks',72.2],['DeepSeek-V3','post-three weeks',70.1],
] as const;
const board:Leaderboard={benchmark:'taiwan-dental-technician-exam-2023',static:'paper',url:FEED,feed:FEED,terms:'The open-access paper is licensed CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',async fetch(){const p=await fetchText('https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12485393/fullTextXML');if(!p.includes('Table 1'))throw Error('Taiwan dental Table 1 missing');return checked(vals.map(([model,setting,score])=>({model,setting,score})),12)}};
export default board;
