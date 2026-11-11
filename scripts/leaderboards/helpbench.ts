// HelpBench: Appendix F, Table 3's Overall mean covers all 450 advice questions and five responses per question.
// The following row is the average within-question standard deviation, not another score or model run.
// The paper uses chat variants with default parameters. Undocumented API snapshots stay unlisted.
// These are static paper results and will not refresh with new models. The anonymous repository disallows
// automated reading, but arXiv permits this separately hosted paper's HTML path.
import type { Leaderboard } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2606.24819';
const AMBIGUOUS = /^(GPT |Gemini |Qwen 3$|DeepSeek 3\.1$|Grok 4\.20$)/;
const board: Leaderboard = {
  benchmark: 'helpbench', url: FEED, feed: FEED, terms: PAPER_TERMS,
  aliases: { 'DeepSeek 3.2': 'deepseek-v3-2' },
  async fetch() {
    const all = await paperTables(FEED);
    const table = all.find(t => t[0]?.[0]?.text === 'Category' && t[0].some(c => c.text === 'GPT 5.3'));
    if (!table || table[1]?.[0]?.text !== 'Overall' || table[0].at(-1)?.text !== 'All models') {
      throw new Error('HelpBench complete Overall table missing');
    }
    const pct = (s: string) => numberCell(s.replace(/%$/, ''));
    const rows = table[0].slice(2, -1).map((c, i) => ({
      model: c.text + (AMBIGUOUS.test(c.text) ? ' (snapshot unspecified)' : ''),
      score: pct(table[1][i + 2].text),
      metrics: { responseStd: pct(table[2][i + 1].text) },
    }));
    if (rows.length !== 18) throw new Error('HelpBench model count changed');
    return rows;
  },
};
export default board;
