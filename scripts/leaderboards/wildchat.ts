// OpenAI evaluates responses to toxic WildChat conversations using the not_unsafe rate.
// Table 16 in the o1 system card gives the overall fraction and each moderation category.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://cdn.openai.com/o1-system-card.pdf';
const board: Leaderboard = {
  benchmark: 'wildchat', url: feed, feed, static: 'paper',
  parts: {
    harassment: { name: 'Harassment', unit: '%' },
    'harassment/threatening': { name: 'Harassment (threatening)', unit: '%' },
    hate: { name: 'Hate', unit: '%' },
    'hate/threatening': { name: 'Hate (threatening)', unit: '%' },
    'self-harm': { name: 'Self-harm', unit: '%' },
    'self-harm/instructions': { name: 'Self-harm (instructions)', unit: '%' },
    'self-harm/intent': { name: 'Self-harm (intent)', unit: '%' },
    sexual: { name: 'Sexual', unit: '%' },
    'sexual/minors': { name: 'Sexual (minors)', unit: '%' },
    violence: { name: 'Violence', unit: '%' },
    'violence/graphic': { name: 'Violence (graphic)', unit: '%' },
  },
  terms: 'OpenAI publishes the system card on its public CDN. Its robots.txt returns BlobNotFound.',
  async fetch() {
    const pdf = await pdfText(feed);
    const table = pdf.match(/Table 16: Detailed breakdown of evaluations on WildChat, measuring not_unsafe([\s\S]*?)Table 17:/)?.[1];
    if (!table || !/Metric\s+GPT-4o\s+o1-preview\s+o1-mini/.test(table)) throw new Error('WildChat table columns changed');
    const lines = [...table.matchAll(/^\s*([\w/-]+)\s+(0\.\d+|1\.0+)\s+(0\.\d+|1\.0+)\s+(0\.\d+|1\.0+)\s*$/gm)];
    const overall = lines.find(r => r[1] === 'Overall');
    const categories = lines.filter(r => r !== overall);
    if (!overall || categories.length !== 11) throw new Error('Incomplete WildChat category breakdown');
    return ['GPT-4o', 'o1-preview', 'o1-mini'].map((model, i) => ({
      model, score: Number(overall[i + 2]) * 100,
      metrics: Object.fromEntries(categories.map(r => [r[1], Number(r[i + 2]) * 100])),
    }));
  },
};
export default board;
