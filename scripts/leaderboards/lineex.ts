// LineEX tests data extraction from scientific line charts.
// Table 5 of the paper reports keypoint-grouping F1 for ChartOCR and LineEX on the authors' dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const FEED = 'https://openaccess.thecvf.com/content/WACV2023/papers/P._LineEX_Data_Extraction_From_Scientific_Line_Charts_WACV_2023_paper.pdf';
const board: Leaderboard = { benchmark: 'lineex', static: 'paper', url: 'https://github.com/Shiva-sankaran/LineEX', feed: FEED, terms: 'The WACV paper is publicly available. Source attribution applies.', async fetch() { const p = await pdfText(FEED); const t = p.split('Table 5: F1 scores for keypoint grouping task')[0]; if (!t.includes('Our Dataset')) throw new Error('LineEX Table 5 missing'); return [{model:'ChartOCR',score:0.93,setting:'Our dataset'},{model:'LINEEXD+A',score:0.93,setting:'Our dataset'}] satisfies LeaderboardRow[]; } };
export default board;
