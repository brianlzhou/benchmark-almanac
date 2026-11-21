// RadNLP grades labels on Japanese lung cancer report sentences by micro F2. Table 6 of the organizers’ proceedings paper reports overall and category scores.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://research.nii.ac.jp/ntcir/workshop/OnlineProceedings18/pdf/ntcir/01-NTCIR18-OV-RADNLP-NakamuraY.pdf";
const categories = ['Inclusion','Measure','Extension','Atelectasis','Satellite','Lymp.','Pleural','Distant'];

const board: Leaderboard = {
  benchmark: "radnlp-2024-segmentation", static: 'paper',
  url: "https://huggingface.co/spaces/RadNLP/RadNLP2024_FormalRun_Japanese_SubTask",
  feed: FEED,
  terms: "No score reuse license verified. Hugging Face allows crawling.",
  parts: Object.fromEntries(categories.map(k => [k,k])),
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split('Table 6: Result (micro F2.0) in Japanese Subtask')[1]?.trim().split(/\n\s*\n/)[0];
    if (!table || !categories.every(c => table.split('\n')[0].includes(c))) throw new Error('Missing Japanese subtask table');
    const rows = table.split('\n').slice(1).map(line => {
      const [,model,...cells] = line.trim().split(/\s+/);
      if (!model || cells.length !== 9 || !cells.every(v => Number.isFinite(Number(v)))) throw new Error('Invalid RadNLP row');
      return { model, submitter:model, setting:'Japanese formal run', score:Number(cells[0]), metrics:Object.fromEntries(categories.map((k,i) => [k,Number(cells[i+1])])) };
    });
    if (rows.length < 4) throw new Error('Expected four Japanese teams');
    return rows;
  },
};
export default board;
