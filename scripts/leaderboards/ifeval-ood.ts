// IFEval-OOD tests unseen instruction constraints. The Tülu 3 report gives prompt-level loose pass@1 on the unseen set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2411.15124';

const board: Leaderboard = {
  benchmark: 'ifeval-ood', static: 'paper',
  url: 'https://arxiv.org/abs/2411.15124',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"T\u00fclu 3 8B": "llama-3-1-tulu-3-8b", "T\u00fclu 3 70B": "tulu-3-tulu-3-70b", "Llama 3.1 8B Instruct": "llama-3-1-8b", "Llama 3.1 70B Instruct": "llama-3-1-70b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t.some(r => r[1]?.startsWith('IFEval OOD') && r[1].includes('Prompt loose')));
    const stages = tables.find(t => t[0]?.[1] === '8B SFT' && t[1]?.includes('Uns.'));
    if (!table || !stages) throw new Error('Missing IFEval-OOD comparisons');
    const main = table.find(r => r[1]?.startsWith('IFEval OOD'))!;
    const checkpoint = stages.find(r => r[0]?.includes('IFEval-OOD'));
    if (!checkpoint) throw new Error('Missing unseen checkpoint results');
    const rows: LeaderboardRow[] = [];
    function add(model: string, v: string) {
      if (!/^\d+(?:\.\d+)?$/.test(v)) throw new Error('Invalid IFEval-OOD score');
      rows.push({model, score: Number(v)});
    }
    main.slice(2).forEach((v, i) => add(table[0][i+2], v));
    for (let i = 1; i < stages[0].length; i++) {
      if (stages[1][i] === 'Uns.' && !stages[0][i].endsWith('Final')) add('Tülu 3 ' + stages[0][i], checkpoint[i]);
    }
    if (rows.length < 10) throw new Error('Incomplete IFEval-OOD results');
    return rows;
  },
};
export default board;
