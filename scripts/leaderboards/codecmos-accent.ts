// CodecMOS-Accent measures subjective naturalness, speaker similarity, and accent similarity in English speech.
// Table 1 provides system-level mean opinion scores. The subjective naturalness MOS is the headline rating.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2603.14328';
const board: Leaderboard = {
  benchmark: 'codecmos-accent', static: 'paper',
  url: 'https://arxiv.org/abs/2603.14328', feed: FEED,
  terms: 'The paper is published under CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[0] === 'System' && t[0]?.[1] === 'S-NAT');
    if (!table) throw new Error('CodecMOS Table 1 missing');
    const rows = table.slice(1).filter((r) => r[0] !== 'Ground Truth').map((r) => {
      const clean = r[0].replace(/\s*\[.*$/, '');
      const parse = (v: string) => Number(v.split('\\pm')[0].trim());
      return { model: clean, score: parse(r[1]), metrics: { speakerSimilarity: parse(r[2]), accentSimilarity: parse(r[3]), objectiveWer: Number(r[4]), objectiveSpeakerSimilarity: Number(r[5]), objectiveAccentSimilarity: Number(r[6]), objectiveUtmos: Number(r[7]) } };
    });
    return checked(rows, 20);
  },
};
export default board;
