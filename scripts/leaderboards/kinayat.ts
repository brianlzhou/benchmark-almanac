// Kinayat tests Egyptian Arabic idiom understanding and pragmatic use.
// Table 3 of the authors' paper reports accuracy for 21 named models on 150 idioms.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2026.eacl-long.341.pdf';
const board: Leaderboard = {
  benchmark: 'kinayat', static: 'paper', url: 'https://aclanthology.org/2026.eacl-long.341/', feed: FEED,
  terms: 'ACL Anthology papers are available under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  parts: { pragmaticUse: { name: 'Pragmatic Use', group: 'Measure' }, understanding: { name: 'Understanding', group: 'Measure' }, contextualUnderstanding: { name: 'Contextual Understanding', group: 'Measure' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split('Model                        Pragmatic Use')[1]?.split('Table 3:')[0];
    if (!table || !table.includes('GPT-4o')) throw new Error('Missing Kinayat Table 3');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)) {
      const m = line.match(/^(.+?)\s+(0\.\d{4})\s+±[^\s]+\s+(0\.\d{4})\s+±[^\s]+\s+(0\.\d{4})/);
      if (!m) continue;
      rows.push({ model: m[1].trim(), score: Number(m[3]) * 100, metrics: { pragmaticUse: Number(m[2]) * 100, contextualUnderstanding: Number(m[4]) * 100 } });
    }
    if (rows.length < 4) throw new Error('Kinayat Table 3 rows missing');
    return rows;
  },
};
export default board;
