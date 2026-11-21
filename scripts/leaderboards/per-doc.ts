// Per-DOC evaluates personalized review scoring for story generation.
// Table 2 reports correlations with human ratings, with Pearson as the headline measure.
import type {Leaderboard} from './types.ts'; import {pdfText} from '../lib/boards/pdf-text.ts'; import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2024.emnlp-main.737.pdf';
const rows=[['LLaMA-2-7b',.146,.117,.094],['LLaMA-2-13b',.172,.182,.147],['LLaMA-2-70b',.214,.232,.181],['GPT-4',.315,.312,.253],['PERSE-7b',.307,.329,.263],['PERSE-13b',.345,.368,.293]] as const;
const board:Leaderboard={benchmark:'per-doc',static:'paper',url:'https://aclanthology.org/2024.emnlp-main.737/',feed:FEED,terms:'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',parts:{spearman:{name:'Spearman correlation'},kendall:{name:'Kendall correlation'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 2: Pearson, Spearman, and Kendall correlations'))throw Error('Per-DOC Table 2 missing');return checked(rows.map(r=>({model:r[0],score:r[1],metrics:{spearman:r[2],kendall:r[3]}})),6)}}; export default board;
