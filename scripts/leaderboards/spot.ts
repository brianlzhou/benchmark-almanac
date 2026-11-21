// SPOT tests whether models can find documented errors in research papers. Table 2 lists precision first.
// The PDF prints each mean with its standard deviation in smaller type. All four measures cover eight independent runs.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://arxiv.org/pdf/2505.11855';
const board: Leaderboard = {
  benchmark: 'spot', feed, url: 'https://arxiv.org/abs/2505.11855', static: 'paper',
  terms: 'The authors publish the paper on arXiv. https://arxiv.org/licenses/',
  headline: 'Table 2 lists precision first, the percentage of model-flagged errors that match a documented error.',
  aliases: { 'o3 (2025-04-16)': 'o3', 'GPT-4.1 (2025-04-14)': 'gpt-4-1',
    'Gemini-2.5-Pro (preview-03-25)': 'gemini-2-5-pro-mar-2025', 'Gemini-2.0-Flash-Lite (001)': 'gemini-2-0-flash-lite',
    'Claude-3.7-Sonnet (20250219)': 'claude-3-7-sonnet', 'Qwen2.5-VL-72B-Instruct': 'qwen2-5-vl-72b',
    'Qwen2.5-VL-32B-Instruct': 'qwen2-5-vl-32b' },
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/Models\s+Think\s+Precision \(%\)\s+Recall \(%\)\s+pass@1 \(%\)\s+pass@4 \(%\)\s*\n([\s\S]*?)\n\s*\n/)?.[1];
    if (!table) throw Error('Missing SPOT Table 2');
    const rows = table.trim().split('\n').map(line => {
      const c = line.trim().split(/\s{2,}/);
      if (c.length !== 6 || !['✓','✗'].includes(c[1])) throw Error('Changed SPOT result layout');
      const pairs = c.slice(2).map(s => {
        const m = s.match(/^(\d+\.\d)(\d+\.\d)$/);
        if (!m) throw Error('Missing SPOT mean or standard deviation');
        return [Number(m[1]), Number(m[2])];
      });
      const [precision,recall,pass1,pass4] = pairs;
      return { model: c[0].replace(':Think)', ')'), setting: c[1] === '✓' ? 'Thinking' : 'Non-thinking',
        score: precision[0], trials: 8, metrics: { std: precision[1], recall: recall[0], recallStd: recall[1],
          passAt1: pass1[0], passAt1Std: pass1[1], passAt4: pass4[0], passAt4Std: pass4[1] } };
    });
    return checked(rows, 10);
  },
};
export default board;
