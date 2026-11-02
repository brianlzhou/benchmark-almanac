// Pencil Puzzle Bench on ppbench.com. The page is server-rendered with one leaderboard table: # | Model |
// Direct Ask | Agentic | Cost/Agentic. The page ranks by the agentic success rate (0 to 100), which is the
// score, and Cost/Agentic is the cost of one puzzle. Model names carry the effort after "@"
// ("claude-fable-5@high"), which becomes the setting. Rows with no agentic run ("--") are skipped. The
// reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { tableRows } from './visulogic.ts';
import { PINCH_ALIASES } from './pinchbench-2.ts';

const URL = 'https://ppbench.com/';

const board: Leaderboard = {
  benchmark: 'pencil-puzzle-bench',
  url: URL,
  feed: `${URL} (leaderboard table, Agentic)`,
  terms: 'Server-rendered public page; robots.txt allows all paths for generic agents with a search=yes, ai-train=no content signal, and the site publishes no terms.',
  // OpenRouter-style slugs, shared with the PinchBench importers
  aliases: PINCH_ALIASES,
  async fetch() {
    const rows = await tableRows(URL, {
      model: /^Model$/i,
      score: /^Agentic$/i,
      cost: /^Cost\/Agentic$/i,
      name: (c) => text(c.html.match(/class="model-name"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? c.text),
    });
    return rows.map((r) => {
      const [model, effort] = r.model.split('@');
      return { ...r, model, setting: effort || undefined };
    });
  },
};
export default board;
