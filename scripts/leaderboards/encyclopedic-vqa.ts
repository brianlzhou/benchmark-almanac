// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Encyclopedic VQA asks about properties of pictured entities. Table 5 and Section 5.6 report three Lens KB Section model runs.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://openaccess.thecvf.com/content/ICCV2023/papers/Mensink_Encyclopedic_VQA_Visual_Questions_About_Detailed_Properties_of_Fine-Grained_Categories_ICCV_2023_paper.pdf';
const board: Leaderboard = {
  benchmark: 'encyclopedic-vqa', feed, url: feed, static: 'paper', harnesses: 'system',
  terms: 'CVF publishes the ICCV paper under the conditions at https://openaccess.thecvf.com/.',
  parts: { single: 'Single-hop single-answer', multi: 'Multi-answer', twoHop: 'Two-hop' },
  headline: 'The headline averages accuracy on single-hop single-answer, multi-answer and two-hop questions.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.match(/System\s+Retrieval\s+Extra input\s+PaLI[^\n]*PaLM[^\n]*GPT-3[\s\S]*?Table 5: Accuracy on single-hop/);
    const section = table?.[0].match(/\bLens\s*\n\s*KB Section\s+-\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%/);
    const lines = paper.split('\n');
    const start = lines.findIndex(l => l.includes('PaLI with Lens KB Section Retrieval obtains an accu-'));
    if (!section || start < 0) throw new Error('Missing Table 5 or Section 5.6');
    const right = lines.slice(start, start + 9).map(l => l.slice(74).trim()).join(' ').replace(/- (racy|hop|answer)/g, '$1');
    const pair = (pattern: RegExp) => {
      const values = right.match(pattern);
      if (!values) throw new Error('Missing multi-answer or two-hop result');
      return values.slice(1).map(Number);
    };
    const pairs = [
      pair(/accuracy of ([\d.]+)% for multi-answer questions and ([\d.]+)% for two/),
      pair(/achieves ([\d.]+)% and ([\d.]+)% for multi-answer and two-hop/),
      pair(/GPT-3 obtains ([\d.]+)% for multianswer and ([\d.]+)% for two-hop/),
    ];
    const rows = ['PaLI', 'PaLM 2 (text-bison@001)', 'GPT-3 (text-davinci-003)'].map((model, i) => {
      const single = Number(section[i + 1]), [multi, twoHop] = pairs[i];
      return { model, harness: 'Lens KB Section', score: (single + multi + twoHop) / 3, metrics: { single, multi, twoHop } };
    });
    return checked(rows, 3);
  },
};
export default board;
