// MMLU-ProX Lite tests multiple-choice knowledge in 29 languages.
// Tables 8 and 9 give average accuracy and language accuracies for five-shot and zero-shot prompts.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://aclanthology.org/2025.emnlp-main.79/';
const feed = 'https://aclanthology.org/2025.emnlp-main.79.pdf';
const languages = 'EN FR DE ES PT IT HI BN UR TE MR NE ZH JA KO VI TH ID AR AF SW WO YO ZU RU UK SR CS HU'.split(' ');
const names = new Intl.DisplayNames('en', { type: 'language' });
const board: Leaderboard = {
  benchmark: 'mmlu-prox-lite', static: 'paper', url, feed,
  terms: 'ACL Anthology publishes the paper under its copyright policy at https://aclanthology.org/faq/copyright/.',
  parts: Object.fromEntries(languages.map(key => [key, { name: names.of(key.toLowerCase())!, group: 'Language' }])),
  aliases: { 'Qwen3-235B': 'qwen3-235b-a22b', 'Phi4-14B': 'phi-4' },
  async fetch() {
    const pdf = await pdfText(feed);
    const rows = [];
    for (const [caption, setting] of [['Table 8: MMLU-ProX Lite 5-shot Results.', '5-shot'],
                                       ['Table 9: MMLU-ProX Lite zero-shot Results.', 'Zero-shot']]) {
      const end = pdf.indexOf(caption);
      const start = pdf.lastIndexOf('Model ', end);
      if (start < 0 || end < 0) throw new Error('Missing ' + caption);
      const [header, ...lines] = pdf.slice(start, end).trim().split(/\n/);
      if (header.trim().split(/\s+/).join(' ') !== ['Model', 'Avg', ...languages].join(' ')) {
        throw new Error('Unexpected Lite language columns');
      }
      for (const line of lines.filter(line => line.trim())) {
        const [label, ...cells] = line.trim().replace(/^1532\s+(?=Qwen3-32B\s)/, '').split(/\s+/);
        if (cells.length !== languages.length + 1 || !cells.every(c => /^\d+(\.\d+)?$/.test(c))) {
          throw new Error('Invalid Lite results for ' + label);
        }
        const [score, ...values] = cells.map(Number);
        const mode = label.endsWith('-Think') ? ', thinking' : label.startsWith('Qwen3-') ? ', non-thinking' : '';
        rows.push({ model: label.replace(/-Think$/, ''), setting: setting + mode, score,
          metrics: Object.fromEntries(languages.map((key, i) => [key, values[i]])) });
      }
    }
    return checked(rows, 30);
  },
};
export default board;
