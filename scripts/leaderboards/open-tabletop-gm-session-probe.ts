// The five-turn tabletop probe counts successful command and conversation checks without tool definitions. The guide publishes pass/warn/fail counts and output lengths.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/Bobby-Gray/open-tabletop-gm/main/docs/LLM-GUIDE.md";

const board: Leaderboard = {
  benchmark: "open-tabletop-gm-session-probe",
  stats: { warnings: { name: 'Warnings', unit: 'count', better: 'lower' }, failures: { name: 'Failures', unit: 'count', better: 'lower' }, estimatedSessionTokens: { name: 'Estimated session tokens', unit: 'tokens', better: 'lower' } },
  url: "https://github.com/Bobby-Gray/open-tabletop-gm/blob/main/docs/LLM-GUIDE.md#probe-results-april-2026-skill-branchesmd-architecture",
  feed: FEED,
  terms: "The repository uses AGPL-3.0-or-later. The guide gives no separate license for model outputs. https://github.com/Bobby-Gray/open-tabletop-gm#license GitHub requests a one-second crawl delay.",
  async fetch() {
    const table = markdownTables(await fetchText(FEED)).find(t => t[0].join('|') === 'Model|P/W/F|Avg output|~20-turn session|Notes');
    if (!table || table.length < 12) throw new Error('Missing five-turn probe');
    return table.slice(1).map(([model, counts, average, session]) => {
      const m = counts.match(/^(\d+)\/(\d+)\/(\d+)$/);
      if (!model || !m) throw new Error('Invalid pass/warn/fail counts');
      const metrics: Record<string,number> = { warnings: Number(m[2]), failures: Number(m[3]) };
      const estimate = num(session); if (estimate != null) metrics.estimatedSessionTokens = estimate;
      return { model, score: Number(m[1]), setting: 'No tool definitions', tokens: num(average), metrics };
    });
  },
};
export default board;
