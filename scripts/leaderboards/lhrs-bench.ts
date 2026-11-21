// LHRS-Bench tests multimodal language models on remote-sensing image understanding.
// Table 5 reports accuracy for eleven capabilities and an overall average.
// This importer reads the authors' comparison table from the ECCV paper PDF.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/09511.pdf';
const capabilities = ['Identity', 'Color', 'Orientation', 'Shape', 'Area', 'Resolution', 'Modality', 'Location', 'Distance', 'Quantity', 'Reasoning'];
const names = ['LLaVA-1.5', 'MiniGPTv2', 'InstructBLIP', 'mPLUG-OWL2', 'QWen-VL-Chat', 'InternLM-XComposer', 'GPT-4-Turbo', 'Claude-3-Opus', 'LHRS-Bot'];

const board: Leaderboard = {
  benchmark: 'lhrs-bench',
  static: 'paper',
  url: 'https://arxiv.org/abs/2402.02544',
  feed,
  terms: 'ECCV paper PDF. https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/09511.pdf',
  parts: Object.fromEntries(capabilities.map(name => [name.toLowerCase(), name])),
  async fetch(): Promise<LeaderboardRow[]> {
    const paper = await pdfText(feed);
    const section = paper.split('Table 5:')[1]?.split('4.3 Evaluation on LHRS-Bench')[0];
    if (!section || !section.includes('LLaVA-1.5') || !section.includes('LHRS-Bot')) throw new Error('Missing LHRS-Bench Table 5');
    const rows: LeaderboardRow[] = [];
    for (const name of names) {
      const match = section.match(new RegExp('(?:^|\\n)\\s*' + name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\s+((?:\\d+(?:\\.\\d+)?\\s+){11}\\d+(?:\\.\\d+)?)\\s*(?:\\n|$)'));
      if (!match) throw new Error('Missing LHRS-Bench row: ' + name);
      const values = match[1].trim().split(/\s+/).map(Number);
      if (values.length !== 12 || values.some(value => !Number.isFinite(value))) throw new Error('Invalid LHRS-Bench row: ' + name);
      const metrics = Object.fromEntries(capabilities.map((capability, index) => [capability.toLowerCase(), values[index]]));
      rows.push({ model: name, score: values[11], metrics });
    }
    return checked(rows, 9);
  },
};

export default board;
