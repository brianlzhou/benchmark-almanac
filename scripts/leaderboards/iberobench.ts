// IberoBench tests language understanding across 62 tasks in five Iberian languages.
// The paper reports normalized scores from 0 to 100 for each language, so this importer
// uses the plain mean of the five language scores as the headline and keeps each language.
// The source is Table 2 in the paper.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://aclanthology.org/2025.coling-main.699.pdf';
const board: Leaderboard = {
  benchmark: 'iberobench', static: 'paper',
  url: 'https://aclanthology.org/2025.coling-main.699/', feed: FEED,
  terms: 'The paper is available from ACL Anthology under its publication terms. https://aclanthology.org/faq/copyright/',
  headline: 'The paper reports five language scores, so this is their plain mean.',
  parts: {
    ca: {name: 'Catalan'}, es: {name: 'European Spanish'}, eu: {name: 'Basque'},
    gl: {name: 'Galician'}, pt: {name: 'European Portuguese'},
  },
  async fetch() {
    const text = await pdfText(FEED);
    const start = text.indexOf('  Aitana-6.3B');
    const end = text.indexOf('Table 2: Normalized benchmark scores', start);
    const section = start >= 0 && end > start ? text.slice(start, end) : undefined;
    if (!section) throw new Error('IberoBench Table 2 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      const m = line.match(/^\s{2,}(.+?)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)(?:\s|$)/);
      if (!m || /Language-specific|Multilingual and SOTA|Model/.test(m[1])) continue;
      const values = m.slice(2).map(Number);
      rows.push({model: m[1].trim(), score: values.reduce((a, b) => a + b, 0) / 5,
        setting: '5-shot', metrics: {ca: values[0], es: values[1], eu: values[2], gl: values[3], pt: values[4]}});
    }
    return checked(rows, 26);
  },
};
export default board;
