// AgentBench FC (function-calling AgentBench, THUDM). The README's table is an image, but it links its full
// "Leaderboard (new)", a published Google Sheet whose CSV export lists each model's pass@1 success rate on
// ALFWorld, DB, KG, OS and WebShop with an AVG column, the board's headline and the score here. Model names
// carry a snapshot date ("GPT-4o (2024-11-20)") and sometimes "Thinking"; the date tag is dropped (dated
// snapshots the resolver would misplace are aliased) and "Thinking" becomes the setting. "AgentRL w/ ..." rows
// are models fine-tuned with AgentRL, not the base models, so they keep their full name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRR3Wl7wsCgHpwUw1_eUXW_fptAPLL3FkhnW_rua0O1Ji_GIVrpTjY5LaKAhwO-WeARjnY_KNw0SYNJ';

/** CSV lines split into cells; the sheet has no quoted commas in the rows read here. */
const cells = (line: string) => line.split(',').map((c) => c.trim());

const board: Leaderboard = {
  benchmark: 'agentbench-fc',
  url: `${SHEET}/pubhtml`,
  feed: `${SHEET}/pub?output=csv (AVG)`,
  terms: 'Published Google Sheet linked from the THUDM/AgentBench README (Apache-2.0); docs.google.com robots.txt allows /spreadsheet paths.',
  aliases: {
    'GPT-4o (2024-11-20)': 'gpt-4o-nov-2024',
    'DeepSeek-R1 (2025-05-28)': 'deepseek-r1-may-2025',
    'DeepSeek-V3 (2025-03-24)': 'deepseek-v3-mar-2025',
    'Claude Sonnet 3.7': 'claude-3-7-sonnet',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
  },
  async fetch() {
    const lines = (await fetchText(`${SHEET}/pub?output=csv`)).split(/\r?\n/).map(cells);
    const head = lines.findIndex((r) => r.includes('AVG'));
    if (head < 0) throw new Error('AVG column not found');
    const iAvg = lines[head].indexOf('AVG');
    const rows: LeaderboardRow[] = [];
    for (const r of lines.slice(head + 1)) {
      const name = r[0];
      const score = num(r[iAvg]);
      if (!name || score === undefined) continue;
      const thinking = / Thinking\b/.test(name);
      const alias = name.replace(/ Thinking\b/, '');
      const model = /\(\d{4}-\d{2}-\d{2}\)$/.test(alias) && !board.aliases?.[alias] ? alias.replace(/\s*\(\d{4}-\d{2}-\d{2}\)$/, '') : alias;
      rows.push({ model, score, setting: thinking ? 'thinking' : undefined });
    }
    return rows;
  },
};
export default board;
