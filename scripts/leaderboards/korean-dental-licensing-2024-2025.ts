// The Korean Dental Licensing Examination benchmark tests multimodal dental question answering.
// The PMC article reports overall accuracy on 642 questions in its results text.
import type {Leaderboard} from './types.ts'; import {fetchText} from '../lib/util.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://pmc.ncbi.nlm.nih.gov/articles/PMC12962161/';
const board:Leaderboard={benchmark:'korean-dental-licensing-2024-2025',url:feed,feed,static:'paper',terms:'The article is publicly available through PubMed Central. https://pmc.ncbi.nlm.nih.gov/about/copyright/',async fetch(){const p=await fetchText(feed);if(!(p.includes('78.66%')&&p.includes('68.85%')&&p.includes('81.46%')&&p.includes('87.69%')))throw new Error('Missing KDLE overall results');return checked([{model:'ChatGPT-4o',score:78.66},{model:'Claude-4 Opus',score:81.46},{model:'Gemini 2.5 Pro',score:87.69},{model:'DeepSeek-V3',score:68.85}],4);}};export default board;
