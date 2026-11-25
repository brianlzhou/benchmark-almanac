// DaLA evaluates Danish linguistic acceptability with real-world corruption types.
// Table 2 reports DaLA Matthews correlation coefficient and macro F1 for ten models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://arxiv.org/pdf/2512.04799';
const board: Leaderboard = { benchmark: 'dala', static: 'paper', url: 'https://arxiv.org/html/2512.04799', feed: FEED, terms: 'The authors publish this paper on arXiv under its applicable terms.', stats: { dalaF1: { name: 'DaLA macro F1', unit: 'score', better: 'higher' } }, async fetch(): Promise<LeaderboardRow[]> {
 const text = await pdfText(FEED); const part = text.split('Danish part of ScaLA              DaLA (ours)')[1]?.split('Table 2:')[0]; if (!part) throw new Error('DaLA Table 2 missing');
 const rows: LeaderboardRow[] = []; const re = /(?:^|\n)\s*([a-z0-9][^\n]+?)\s{2,}(\d+\.\d+)\s±[^\n]+\s+(\d+\.\d+)\s±[^\n]+\s+(\d+\.\d+)\s±[^\n]+\s+(\d+\.\d+)\s±/g; let m;
 while ((m = re.exec(part))) { const model=m[1].trim(); const mcc=Number(m[4]), f1=Number(m[5]); rows.push({model, score:mcc, metrics:{dalaF1:f1}}); }
 if (rows.length < 10) throw new Error(`DaLA rows changed: ${rows.length}`); return rows;
}}; export default board;
