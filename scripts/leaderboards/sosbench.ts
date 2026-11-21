// SoSBench evaluates whether models comply with requests that violate scientific safety policies.
// Tables 2 and 3 report overall policy violation rates as fractions, with 90% intervals. Lower is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2505.21605';
const board: Leaderboard = {
  benchmark: 'sosbench', feed, url: feed, static: 'paper',
  terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The score is the overall policy violation rate in percent, with the paper’s 90% confidence interval.',
  parts: { biology: 'Biology', chemistry: 'Chemistry', medicine: 'Medicine', pharmacology: 'Pharmacology', physics: 'Physics', psychology: 'Psychology' },
  aliases: { 'Deepseek-R1-Distill-70B': 'deepseek-r1-distill-llama-70b', 'GPT-5 (20250807)': 'gpt-5', 'o3 (20250416)': 'o3', 'o4-mini (20250416)': 'o4-mini',
    'GPT-4.1 (20250414)': 'gpt-4-1', 'GPT-4o (20241120)': 'gpt-4o-nov-2024',
    'Gemini-2.5-Pro (20250506)': 'gemini-2-5-pro-may-2025', 'Gemini-2.5-Flash (20250417)': 'gemini-2-5-flash-apr-2025',
    'Deepseek-V3 (0324)': 'deepseek-v3-mar-2025', 'Claude-4.1-Opus': 'claude-opus-4-1', 'Claude-4-Sonnet': 'claude-sonnet-4' },
  async fetch() {
    const paper = await paperHtml(feed);
    const tables = flatPaperTables(paper).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const think of [true,false]) {
      const header = 'Model Name|' + (think ? 'Think|' : '') + 'Biol.|Chem.|Med.|Pharm.|Phys.|Psych.|Overall';
      const table = tables.find(t => t[1]?.join('|') === header);
      if (!table) throw Error('Missing SoSBench overall PVR table');
      for (const c of table.slice(2)) {
        const interval = c.at(-1)?.match(/^(\d\.\d+)\s*\\pm\s*(\d\.\d+)$/);
        if (!interval) throw Error('Missing SoSBench overall interval');
        const score = Number(interval[1]) * 100, half = Number(interval[2]) * 100;
        const model = c[0].replace(/\s+\( [^()]+ \)$/, '').replace(/-Thinking$/, '');
        const mode: Record<string,string> = { '✓': 'Thinking', '✗': 'Non-thinking', '◑': 'Hybrid thinking' };
        if (think && !mode[c[1]]) throw Error('Unexpected thinking mode');
        const metrics = Object.fromEntries(Object.keys(board.parts!).map((key, i) => {
          const raw = c[i + (think ? 2 : 1)];
          if (!/^\d\.\d+$/.test(raw)) throw Error('Invalid subject rate');
          return [key, Number(raw) * 100];
        }));
        rows.push({ model, score, metrics, low: score-half, high: score+half, ...(think ? { setting: mode[c[1]] } : {}) });
      }
    }
    return checked(rows, 32);
  },
};
export default board;
