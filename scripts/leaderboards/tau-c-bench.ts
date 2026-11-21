// τc-Bench tests tool-using customer-support agents on generated Airline, Retail and Telecom tasks.
// The source reports no overall score. The headline is the plain mean of the three τc-Bench pass^1 domain scores.
// This importer reads Table 1 from the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/pdf/2605.28556';
const board: Leaderboard = {
  benchmark: 'tau-c-bench', static: 'paper', url: 'https://arxiv.org/html/2605.28556', feed: FEED,
  terms: 'arXiv permits this paper PDF under its standard terms.',
  headline: 'The paper reports no overall score, so this is the plain mean of Airline, Retail and Telecom pass^1 scores.',
  parts: { airline: 'Airline pass^1', retail: 'Retail pass^1', telecom: 'Telecom pass^1' },
  async fetch() {
    const text = await pdfText(FEED);
    const section = text.split('Main Results: Performance')[1]?.split('Experimental Setup')[0];
    if (!section) throw new Error('τc-Bench Table 1 missing');
    const rows: LeaderboardRow[] = [];
    let user = '';
    for (const line of section.split('\n')) {
      const um = line.match(/^\s*User:\s*(.+)$/);
      if (um) { user = um[1].trim(); continue; }
      const m = line.match(/^\s*(Gemini-3-flash|Gemini-2.5-flash|GPT-5.2|Qwen-32B|deepseek-3.1|claude-sonnet-4.6)\s+([0-9.]+)\s+([0-9.]+)\s+[-+0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s+[-+0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s+[-+0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s+[-+0-9.]+\s*$/i);
      if (!m || !user) continue;
      const airline = Number(m[2]), airline3 = Number(m[4]), retail = Number(m[6]), telecom = Number(m[8]);
      rows.push({ model: m[1], setting: `user simulator: ${user}`, score: (airline + retail + telecom) * 100 / 3, metrics: { airline: airline * 100, airlinePass3: airline3 * 100, retail: retail * 100, telecom: telecom * 100 } });
    }
    return checked(rows, 2);
  },
};
export default board;
