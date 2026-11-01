// Arena's Search Arena, read through Arena's Hugging Face dataset: its "search_style_control" subset, overall
// category, latest split. Its default view controls for style, so this reads the style-controlled subset.
// Search Arena names a model with its search tool: "claude-opus-4-6-search", "gemini-3-pro-grounding". The
// model is the part before the suffix, and the tool becomes the row's harness. The helper lives in lmarena-elo.ts.
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRows } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-search-arena',
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('search_style_control'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: async () =>
    (await arenaRows('search_style_control')).map((r) => {
      const m = r.model.match(/^(.+?)[-_ ](search|grounding)$/i);
      return m ? { ...r, model: m[1], harness: m[2].toLowerCase() === 'grounding' ? 'Google Search grounding' : 'search' } : r;
    }),
};
export default board;
