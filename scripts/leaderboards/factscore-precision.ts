// FActScore precision: the official README reports factual precision as a percentage for 12 language models.
// Use column A, retrieval+ChatGPT, explicitly identified as the default scorer. Column B remains a metric.
// Response rate and facts per response also remain metrics. Ambiguous model snapshots stay unlisted.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/shmsw25/FActScore/main/README.md';
const board: Leaderboard = {
  benchmark: 'factscore-precision', url: 'https://github.com/shmsw25/FActScore', feed: FEED,
  terms: 'The FActScore authors publish these results in their public repository, with attribution and repository license requirements retained.',
  // The README links these exact weight repositories.
  aliases: { 'Dolly 12B': 'dolly-2-0-12b', 'StableLM tuned 7B': 'stablelm-tuned-alpha-7b' },
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].includes('FActScore from (A)'));
    if (!table) throw new Error('FActScore precision table missing');
    return table.slice(1).filter(r => r[0] && num(r[3]) !== undefined).map(r => ({
      model: /^(?:GPT-4|ChatGPT|InstructGPT|Vicuna \d+B)$/.test(r[0]) ? `${r[0]} (snapshot unspecified)` : r[0],
      setting: 'retrieval+ChatGPT', score: num(r[3])!,
      metrics: { respondPercent: num(r[1])!, facts: num(r[2])!, retrievalLlamaNpm: num(r[4])! },
    }));
  },
};
export default board;
