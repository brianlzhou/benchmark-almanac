// NOVA-63 measures accuracy across 14 languages and 63 academic disciplines.
// Table 2 in the EMNLP paper averages by primary discipline, then across languages.
// Tables 7 and 8 report the alternative averages by question and secondary discipline.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2025.emnlp-main.364.pdf';
const languages = ['En', 'Fr', 'De', 'It', 'Pt', 'Ru', 'Es', 'Ar', 'Zh', 'Id', 'Ja', 'Ko', 'Th', 'Vi'];

function readTable(paper: string, number: number) {
  const caption = paper.indexOf(`Table ${number}:`);
  const page = paper.slice(paper.lastIndexOf('\f', caption), caption);
  if (caption < 0 || !page.replace(/\s+/g, ' ').includes(['Model', ...languages, 'Avg'].join(' ')))
    throw new Error('NOVA-63 language columns changed in Table ' + number);
  const rows = new Map<string, number[]>();
  for (const line of page.split('\n')) {
    const cells = line.trim().split(/\s+/);
    if (!/^\d+\.\d+$/.test(cells.at(-1) ?? '')) continue;
    const name = cells.at(-16);
    const values = cells.slice(-15);
    if (!name || values.some(v => !/^\d+\.\d+$/.test(v)) || rows.has(name))
      throw new Error('NOVA-63 malformed model row: ' + line);
    rows.set(name, values.map(Number));
  }
  return rows;
}

export default {
  benchmark: 'nova-63', static: 'paper', url: 'https://aclanthology.org/2025.emnlp-main.364/', feed,
  terms: 'ACL Anthology licenses this 2025 paper under CC BY 4.0. Its robots.txt returned 404.',
  parts: Object.fromEntries(languages.map(key => [key, { name: key, group: 'Language' }])),
  aliases: {
    'Aya-8B': 'aya-expanse-8b', 'Aya-32B': 'aya-expanse-32b',
    'Mistral-Small-Instruct': 'mistral-small-v24-09', 'Mistral-Large-Instruct': 'mistral-large-2-nov-2024',
    'Mistral-Nemo-Instruct': 'mistral-nemo', 'Claude4-Sonnet': 'claude-sonnet-4',
    'Claude4-Sonnet-thinking': 'claude-sonnet-4', 'Claude3.7-sonnet-thinking': 'claude-3-7-sonnet',
  },
  async fetch() {
    const paper = await pdfText(feed);
    const main = readTable(paper, 2);
    const questions = readTable(paper, 7);
    const secondary = readTable(paper, 8);
    if (main.size < 62 || questions.size !== main.size || secondary.size !== main.size)
      throw new Error('NOVA-63 expected the complete model comparison');
    return [...main].map(([model, values]) => {
      if (!secondary.has(model) || !questions.has(model)) throw new Error('NOVA-63 missing ' + model);
      return { model, score: values[14], ...(model.endsWith('-thinking') ? { setting: 'thinking' } : {}),
        metrics: { ...Object.fromEntries(languages.map((lang, i) => [lang, values[i]])),
          questionAverage: questions.get(model)![14], secondaryDisciplineAverage: secondary.get(model)![14] } };
    });
  },
} satisfies Leaderboard;
