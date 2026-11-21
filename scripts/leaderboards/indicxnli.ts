// IndicXNLI tests natural language inference in eleven Indian languages.
// Table 3 of the published paper gives ModAvg, the authors' model average across languages,
// and individual language accuracies for six training and evaluation protocols.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2022.emnlp-main.755.pdf';
const languages = { as: 'Assamese', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', or: 'Odia',
  pa: 'Punjabi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', hi: 'Hindi' };
const board: Leaderboard = {
  benchmark: 'indicxnli', url: 'https://aclanthology.org/2022.emnlp-main.755/', feed, static: 'paper', parts: languages,
  terms: 'ACL publishes this EMNLP 2022 paper under its anthology terms at https://aclanthology.org/faq/copyright/.',
  async fetch() {
    const paper = await pdfText(feed);
    const table = paper.split('Table 3: Here, LangAvg')[0].split('\f').at(-1);
    if (!table || !table.includes('ModAvg') || !table.includes(Object.keys(languages).join(' '))) throw new Error('Missing Table 3');
    const rows: LeaderboardRow[] = [];
    for (const [left, right] of [['Indic Train', 'English Train'], ['English Eval', 'English+Indic Train'], ['Train All', 'Cross Lingual Transfer']]) {
      const start = table.indexOf(left);
      const block = table.slice(start).split('LangAvg')[0];
      if (start < 0 || !block.split('\n')[0].includes(right)) throw new Error('Missing IndicXNLI settings');
      for (const match of block.matchAll(/^\s*(XLM-R|iBERT|mBERT|MuRIL)[ \t]+([\d \t]+)$/gm)) {
        const values = match[2].trim().split(/\s+/).map(Number);
        if (values.length !== 24) throw new Error('Missing IndicXNLI scores');
        for (const [i, setting] of [left, right].entries()) {
          const metrics = Object.fromEntries(Object.keys(languages).map((key, j) => [key, values[i * 12 + j]]));
          rows.push({ model: match[1], setting, score: values[i * 12 + 11], metrics });
        }
      }
    }
    return checked(rows, 24);
  },
};
export default board;
