// AOX scores generated Tetris games on eleven requirements. Its scoreboard reports the final rubric score after the self-check pass.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const feed = "https://www.aox.cz/bench/tetris/";

const board: Leaderboard = {
  benchmark: "aox-local-llm-tetris-test",
  url: "https://www.aox.cz/bench/tetris/",
  feed,
  terms: "The scoreboard does not state a reuse license. https://www.aox.cz/bench/tetris/ The feed host publishes robots.txt at https://www.aox.cz/robots.txt.",
  stats: {
    P1: { name: 'First pass time', unit: 'seconds', better: 'lower' },
    P2: { name: 'Second pass time', unit: 'seconds', better: 'lower' },
    Total: { name: 'Total time', unit: 'seconds', better: 'lower' },
    Tokens: { name: 'Total tokens', unit: 'tokens' },
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const table of tables(await fetchText(feed))) {
      const header = table[0]?.map(c => c.text);
      if (!header?.includes('Model') || !header.includes('Rubric (11 items)')) continue;
      for (const cells of table.slice(1)) {
        const cell = (name: string) => cells[header.indexOf(name)]?.text;
        const label = cell('Model'), rubric = cell('Rubric (11 items)')?.match(/(\d+)\/11/);
        const [model, setting] = (label ?? '').split(/\s+/);
        if (!model || !rubric) throw new Error('Incomplete Tetris row');
        const metrics: Record<string, number> = {};
        for (const name of ['P1', 'P2', 'Total', 'Tokens']) {
          const value = num(cell(name));
          if (value !== undefined) metrics[name] = value;
        }
        const link = cells.at(-1)?.html.match(/href="([^"]+)"/)?.[1];
        rows.push({ model, setting, score: Number(rubric[1]), cost: num(cell('Cost')), metrics, link: link ? new URL(link, feed).href : undefined });
      }
    }
    if (rows.length < 12) throw new Error('Incomplete Tetris scoreboard');
    return rows;
  },
};
export default board;
