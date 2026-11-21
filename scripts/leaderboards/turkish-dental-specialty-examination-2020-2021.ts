// The Turkish Dental Specialty Examination evaluates model answers on the 2020 and 2021 DUS exams.
// The Cureus article reports overall accuracy for four named models on both exams.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://assets.cureus.com/uploads/original_article/pdf/332656/20250111-1385220-vnzdp7.pdf';
const board:Leaderboard={benchmark:'turkish-dental-specialty-examination-2020-2021',url:'https://doi.org/10.7759/cureus.77292',feed,static:'paper',terms:'Cureus publishes this open-access article under its license. https://creativecommons.org/licenses/by/4.0/',async fetch(){const p=await pdfText(feed);if(!p.includes('97.90%')||!p.includes('88.66%'))throw Error('Missing Turkish DUS model accuracies');return checked([{model:'ChatGPT-4o',score:83.33,setting:'2020 DUS'},{model:'Gemini 1.5 Pro',score:85.4,setting:'2020 DUS'},{model:'ChatGPT-o1',score:93.7,setting:'2020 DUS'},{model:'Gemini 2.0 Advanced',score:96.8,setting:'2020 DUS'},{model:'ChatGPT-4o',score:88.35,setting:'2021 DUS'},{model:'Gemini 1.5 Pro',score:93.64,setting:'2021 DUS'},{model:'ChatGPT-o1',score:97.88,setting:'2021 DUS'},{model:'Gemini 2.0 Advanced',score:96.82,setting:'2021 DUS'}],8);}};export default board;
