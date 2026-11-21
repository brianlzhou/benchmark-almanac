// MedAgentBench tests completion of medical tasks in a simulated electronic health record.
// Tables 3 and 4 report overall success and success by task type and difficulty.
import type { Leaderboard } from './types.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2501.14654';
const board: Leaderboard = {
  benchmark: 'medagentbench', feed, url: feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: { query: 'Query', action: 'Action', easy: 'Easy', medium: 'Medium', hard: 'Hard' },
  aliases: { 'Claude 3.5 Sonnet v2': 'claude-3-5-sonnet-october-2024', 'GPT-4o (snapshot unspecified)': 'gpt-4o-nov-2024',
    'Llama 3.3': 'llama-3-3-70b-instruct', 'DeepSeek-V3 (snapshot unspecified)': 'deepseek-v3', 'Qwen2.5': 'qwen2-5-72b' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const types = tables.find(t => t[0]?.join('|') === 'Model|Size|Form|Overall SR|Query SR|Action SR');
    const difficulties = tables.find(t => t[0]?.join('|') === 'Model|Size|Form|Overall SR|Easy SR|Medium SR|Hard SR');
    if (!types || !difficulties) throw Error('Missing MedAgentBench success rates');
    function percent(v: string) {
      if (!/^\d+(\.\d+)?%$/.test(v)) throw Error('Invalid success rate: ' + v);
      return parseFloat(v);
    }
    return checked(types.slice(1).map(([model, size, form, overall, query, action]) => {
      const r = difficulties.find(r => r[0] === model);
      if (!r || r[3] !== overall) throw Error('Mismatched table entry for ' + model);
      return { model, score: percent(overall), open: form === 'open', params: size === 'N/A' ? undefined : parseFloat(size),
        metrics: { query: percent(query), action: percent(action), easy: percent(r[4]), medium: percent(r[5]), hard: percent(r[6]) } };
    }), 12);
  },
};
export default board;
