// xCodeEval tests multilingual code understanding, generation, translation, and retrieval.
// Table 5 compares three models on program synthesis. Its average pass@5 covers eleven languages.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = 'https://aclanthology.org/2024.acl-long.367.pdf';
const board: Leaderboard = {
  benchmark: 'xcodeeval', url: feed, feed, static: 'paper',
  headline: 'The paper compares models on program synthesis using average pass@5 on the Compact split.',
  aliases: { 'Starcoderbase-3b': 'starcoder-2-3b', 'CodeLlama-7b-Instruct': 'codellama-34b-instruct', 'CodeLlama-13b-Instruct': 'codellama-34b-instruct' },
  terms: 'The ACL Anthology publishes this paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const text = await pdfText(feed);
    const match = text.match(/Model\s+Trained\s+Metric\s+([^\n]+?)\s+Avg\s*\n([\s\S]+?)Table 5: Results on Program Synthesis task on Compact split/);
    if (!match) throw new Error('Missing Table 5 program synthesis results');
    const languages = match[1].trim().split(/\s+/);
    if (languages.length !== 11) throw new Error('Program synthesis language columns changed');
    board.parts = Object.fromEntries(languages.map(lang => [lang, lang]));
    const rows = match[2].trim().split(/\r?\n/).map(line => {
      const [model, trained, metric, ...cells] = line.trim().split(/\s+/);
      if (metric !== 'pass@5' || cells.length !== 12 || !cells.every(c => /^\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid program synthesis row');
      return { model, setting: trained === '✓' ? 'Fine-tuned' : 'Zero-shot', score: Number(cells[11]),
        metrics: Object.fromEntries(languages.map((lang,i) => [lang, Number(cells[i])])) };
    });
    return checked(rows, 3);
  },
};
export default board;
