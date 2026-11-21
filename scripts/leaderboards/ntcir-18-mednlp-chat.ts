// NTCIR-18 MedNLP-CHAT tests medical, ethical and legal risk classification in chatbot answers.
// Table 9 reports averaged German-subtask accuracy and macro F1 for six named baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://research.nii.ac.jp/ntcir/workshop/OnlineProceedings18/pdf/ntcir/01-NTCIR18-OV-MEDNLP-AramakiE.pdf';
const board: Leaderboard = { benchmark: 'ntcir-18-mednlp-chat', static: 'paper', url: 'https://sociocom.naist.jp/mednlp-chat/', feed: FEED, terms: 'The NTCIR proceedings are publicly available. Source attribution applies.', stats: { accuracy: { name: 'Accuracy', unit: '%', better: 'higher' } }, async fetch() { const p = await pdfText(FEED); if (!p.includes('Table 9: Averaged scores across risks')) throw new Error('NTCIR Table 9 missing'); return [ ['XLM-RoBERTa',57.1,54.1], ['GerMedBERT',64.5,65.4], ['Llama70B baseline',57.5,59.4], ['Llama70B few-shot',64.0,67.8], ['ChatGPT 4o baseline',56.6,61.0], ['ChatGPT 4o few-shot',65.7,70.2] ].map(([model, score, accuracy])=>({model:model as string,score:score as number,metrics:{accuracy:accuracy as number}})); } };
export default board;
