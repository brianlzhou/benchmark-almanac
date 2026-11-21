// WMT26 Video Subtitle Translation evaluates multilingual subtitle translation systems.
// Table 4 reports final macro-average scores, and Table 2 names each team's base models.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/2026.wmt-main.58.pdf';
const rows: LeaderboardRow[]=[
 {model:'Hy-MT2-7B',submitter:'ReopenAI',harness:'ReopenAI',models:['Hy-MT2-7B','Gemma-4-12B-it'],score:89.357,metrics:{en:90.195,id:87.845,ms:82.160,th:89.015,zhTW:97.571}},
 {model:'Gemma-4-12B-it',submitter:'laniqo',harness:'laniqo',score:78.265,metrics:{en:74.155,id:74.270,ms:69.120,th:79.895,zhTW:93.885}},
 {model:'Hy-MT2-7B',submitter:'AuditTranslate',harness:'AuditTranslate',models:['Hy-MT2-7B','Gemma-4-12B INT4'],score:74.705,metrics:{en:74.705}},
 {model:'Hy-MT2-7B',submitter:'LensLinguals',harness:'LensLinguals',score:73.956,metrics:{en:75.255,th:72.657}},
 {model:'Hy-MT2-7B',submitter:'rupiah',harness:'rupiah',models:['Hy-MT2-7B','CometKiwi'],score:69.248,metrics:{en:70.895,id:67.600}},
 {model:'Qwen3.5-9B-Instruct',submitter:'BVSLP',harness:'BVSLP',score:58.459,metrics:{en:60.480,id:62.420,ms:62.000,th:56.025,zhTW:51.370}},
 {model:'Hy-MT2-1.8B',submitter:'paramanandaAI',harness:'paramanandaAI',score:55.645,metrics:{en:55.645}},
 {model:'Hy-MT2-1.8B',submitter:'SubVision',harness:'SubVision',score:49.775,metrics:{en:49.775}},
];
const board:Leaderboard={benchmark:'wmt26-video-subtitle-translation',static:'paper',url:'https://aclanthology.org/2026.wmt-main.58/',feed:FEED,harnesses:'system',terms:'ACL Anthology makes this paper available under its publication terms. https://aclanthology.org/faq/copyright/',parts:{en:{name:'English'},id:{name:'Indonesian'},ms:{name:'Malay'},th:{name:'Thai'},zhTW:{name:'Traditional Chinese'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 4: Final mean scores'))throw Error('WMT26 video Table 4 missing');return checked(rows,8)}};
export default board;
