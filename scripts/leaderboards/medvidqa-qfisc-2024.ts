// MedVidQA tests temporal segmentation and captioning of medical demonstrations.
// Table 5 gives alignment precision at two thresholds. Tables 6 and 7 give caption
// and human ratings. NIST's QFISC appendix identifies each team and model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://trec.nist.gov/pubs/trec33/papers/Overview_medvidqa.pdf';
const board: Leaderboard = {
  benchmark: 'medvidqa-qfisc-2024', static: 'paper', url: 'https://trec.nist.gov/pubs/trec33/appendices/trec2024-medvidqa-qfisc.html', feed,
  terms: 'NIST publishes the proceedings under the applicable terms at https://www.nist.gov/disclaimer.',
  headline: 'The headline is step alignment precision at the specified matching threshold, the first measure in Table 5.',
  stats: Object.fromEntries(Object.entries({ recall: 'Recall', f1: 'F-score', iou03: 'IoU at 0.3', iou05: 'IoU at 0.5',
    iou07: 'IoU at 0.7', miou: 'Mean IoU', bleu2: 'BLEU-2', bleu3: 'BLEU-3', meteor: 'METEOR',
    rougeL: 'ROUGE-L', spice: 'SPICE', bert: 'BERTScore', completeness: 'Human completeness', accuracy: 'Human accuracy',
    coherence: 'Human coherence' }).map(([key, name]) => [key, {name, unit: 'score', better: 'higher'}])),
  async fetch() {
    const text = await pdfText(feed);
    const results = text.split(/θ\s+Team\s+RunID\s+Precision\s+Recall\s+F-score\s+IoU=0.3\s+IoU=0.5\s+IoU=0.7\s+mIoU/)[1]?.split('Table 5:')[0];
    if (!results) throw new Error('Missing QFISC precision table');
    const extract = (section: string, count: number) => section.split('\n').flatMap(line => {
      const cells = line.trim().split(/\s+/);
      if (cells[0] === 'PolySmart' || cells[0] === 'DoshishaUzlDfki') cells.shift();
      const [run, ...values] = cells;
      if (!run?.includes('_')) return [];
      if (values.length !== count || values.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid QFISC scores for ' + run);
      return [{run, values: values.map(Number)}];
    });
    const captions = text.split(/Team\s+RunID\s+BLEU-2\s+BLEU-3\s+METEOR\s+ROUGE-L\s+SPICE\s+BERTScore/)[1]?.split('Table 6:')[0];
    const humans = text.split(/Team\s+RunID\s+Completeness\s+Accuracy\s+Coherenece/)[1]?.split('Ground Truth')[0];
    if (!captions || !humans) throw new Error('Missing caption or human evaluation');
    const caption = new Map(extract(captions, 6).map(r => [r.run, r.values]));
    const human = new Map(extract(humans, 3).map(r => [r.run, r.values]));
    const rows: LeaderboardRow[] = [];
    const blocks = results.split(/(?=\s*PolySmart\s+LLaVA)/).filter(s => s.trim().startsWith('PolySmart'));
    if (blocks.length !== 2) throw new Error('Expected two threshold groups');
    for (const [i, block] of blocks.entries()) {
      const threshold = ['0.4', '0.5'][i];
      if (!block.split('\n').some(line => line.trim() === threshold)) throw new Error('Threshold changed');
      for (const {run, values: [score, recall, f1, iou03, iou05, iou07, miou]} of extract(block, 7)) {
        const blend = run.startsWith('LLaVA');
        const model = blend ? 'LLaVA-NeXT-Video-32B-Qwen' : /GPT/.test(run) ? 'GPT-4o' : 'Mistral Large 2 (snapshot unspecified)';
        const extra: Record<string, number> = {};
        if (i === 0) {
          const c = caption.get(run), h = human.get(run);
          if (!c || !h) throw new Error('Missing companion results for ' + run);
          ['bleu2','bleu3','meteor','rougeL','spice','bert','completeness','accuracy','coherence'].forEach((k,j) => { extra[k] = [...c,...h][j]; });
        }
        rows.push({ model, submitter: blend ? 'PolySmart' : 'DoshishaUzlDfki', setting: run + ', threshold ' + threshold,
          ...(blend ? { models: [model, 'GPT-4o'] } : {}), ...(run.startsWith('CoSeg') ? { harness: 'CoSeg' } : {}),
          score, metrics: {recall, f1, iou03, iou05, iou07, miou, ...extra} });
      }
    }
    return checked(rows, 12);
  },
};
export default board;
