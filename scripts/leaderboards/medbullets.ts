// Medbullets tests answers to clinical multiple-choice questions. Table 2 gives accuracy for two zero-shot prompts.
// The four- and five-option versions ask the same questions under different answer-choice settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.naacl-long.182.pdf';
// Section 3.1 identifies the checkpoints in the order of the columns in Table 2.
const models = ['gpt-3.5-turbo-0613', 'gpt-4-0613', 'chat-bison-001', 'Llama-2-70b-chat', 'Llama-3-70b-chat', 'medalpaca-13b', 'meerkat-7b-v1.0'];
const board: Leaderboard = {
  benchmark: 'medbullets', feed, url: 'https://aclanthology.org/2025.naacl-long.182/', static: 'paper',
  terms: 'ACL Anthology lists its publication terms at https://aclanthology.org/faq/copyright/.',
  aliases: { 'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023', 'gpt-4-0613': 'gpt-4-jun-2023',
    'Llama-2-70b-chat': 'llama-2-70b', 'Llama-3-70b-chat': 'llama-3-70b' },
  async fetch() {
    const text = await pdfText(feed);
    const table = text.match(/GPT-3\.5\s+GPT-4\s+PaLM 2\s+Llama 2\s+Llama 3\s+MedAlpaca\s+Meerkat\s*\n([\s\S]+?)Table 2: Prediction accuracy/);
    if (!table || !table[1].includes('X→Y') || !table[1].includes('X→RY')) throw new Error('Missing Table 2 column or prompt');
    const rows: LeaderboardRow[] = [];
    const blocks = table[1].split('X→RY');
    for (const [i, block] of blocks.entries()) {
      for (const match of block.matchAll(/Medbullets-([45])[ \t]+([\d. \t]+)\n/g)) {
        const values = match[2].trim().split(/\s+/).map(numberCell);
        if (values.length !== models.length) throw new Error('Incomplete Medbullets row');
        const setting = match[1] + ' options, zero-shot ' + (i === 0 ? 'direct answer' : 'explain then answer');
        models.forEach((model, j) => rows.push({ model, setting, score: values[j] }));
      }
    }
    return checked(rows, 28);
  },
};
export default board;
