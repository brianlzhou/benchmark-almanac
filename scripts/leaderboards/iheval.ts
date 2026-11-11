// IHEval: the paper's Avg. score in conflict mode, which matches the catalog's instruction-conflict task.
// Read the main and appendix tables, deduplicating repeated results. The nine task scores are metrics.
// Reference and aligned runs measure different conditions and are not used as conflict scores.
// Llama 3 lacks both tool-use tasks, so its partial-task average is excluded. IPP is a whole-set prompt variant.
// These are static paper results and will not refresh with new models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2502.08745';
const KEYS = ['ruleSingle', 'ruleMulti', 'extraction', 'generation', 'classification', 'hijack', 'passwordExtraction', 'toolIntrinsic', 'toolInjected'];
const names: Record<string, string> = {
  'GPT-4o (2024-0806)': 'gpt-4o-2024-08-06', 'GPT-4o mini (2024-0718)': 'gpt-4o-mini-2024-07-18',
  'GPT-3.5-turbo (2024-0125)': 'gpt-3.5-turbo-0125', 'Mistral-Large (2407)': 'Mistral Large 2 (2024-07)',
  'GPT-4o (0806)': 'gpt-4o-2024-08-06', 'Mistral Large': 'Mistral Large 2 (2024-07)',
  'LLaMA 3.1-70B': 'LLaMA-3.1 70B',
};
const board: Leaderboard = {
  benchmark: 'iheval', url: 'https://github.com/ytyz1307zzh/IHEval', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'Mistral Large 2 (2024-07)': 'mistral-large-2-jul-2024', 'gpt-3.5-turbo-0125': 'gpt-3-5-turbo-jan-2024' },
  async fetch() {
    const tables = await paperTables(FEED);
    const rows = new Map<string, LeaderboardRow>();
    for (const table of tables) {
      if (!table[1]?.some(c => c.text === 'Single.')) continue;
      for (const c of table.slice(2)) {
        if (c[1]?.text !== 'conflict') continue;
        if (c.length !== 14) throw new Error('IHEval table shape changed');
        if (c.slice(2, 11).some(v => v.text === '-')) continue;
        const model = names[c[0].text] ?? c[0].text;
        const row = { model, score: numberCell(c[11].text), metrics: Object.fromEntries(KEYS.map((k, i) => [k, numberCell(c[i + 2].text)])) };
        const prior = rows.get(model);
        if (prior && JSON.stringify(prior) !== JSON.stringify(row)) throw new Error(`Conflicting IHEval rows: ${model}`);
        rows.set(model, row);
      }
    }
    const ipp = tables.find(t => t[0]?.map(c => c.text).join('|') === 'Model|IPP|Rule|Task|Safety|Tool|Avg');
    if (!ipp) throw new Error('IHEval IPP table missing');
    for (const c of ipp.slice(1)) {
      if (c[1]?.text !== '✔') continue;
      const model = names[c[0].text] ?? c[0].text;
      rows.set(`${model}|ipp`, { model, setting: 'instruction priority prompt', score: numberCell(c[6].text),
        metrics: Object.fromEntries(['rule', 'task', 'safety', 'tool'].map((k, i) => [k, numberCell(c[i + 2].text)])) });
    }
    if (rows.size < 14) throw new Error('IHEval complete-model rows missing');
    return [...rows.values()];
  },
};
export default board;
