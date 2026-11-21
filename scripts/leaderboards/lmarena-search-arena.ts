// Arena's Search Arena, read through Arena's Hugging Face dataset: its "search_style_control" subset, overall
// category, latest split. Its default view controls for style, so this reads the style-controlled subset.
// Search Arena names a model with its search tool. Snapshots before 2026-11-06 wrote it as a suffix
// ("claude-opus-4-6-search", "gemini-3-pro-grounding"). Later ones write it in a parenthesis ("Claude Opus 4.6
// (Search)", "GPT-5.2 (Search, Non-Reasoning)"). The model is the part before it, the tool becomes the row's
// harness, and anything after the tool becomes the setting. The helper lives in lmarena-elo.ts. Each row also
// keeps the model's factuality-weighted rating (search_factuality) as metrics["cat:factuality"].
import type { Leaderboard } from './types.ts';
import { ARENA_ALIASES, ARENA_TERMS, arenaFeed, arenaRowsByCategory } from './lmarena-elo.ts';

const board: Leaderboard = {
  benchmark: 'lmarena-search-arena',
  stats: { votes: { name: 'Votes', unit: 'count' } },
  parts: { 'cat:factuality': 'Factuality' },
  url: 'https://arena.ai/leaderboard',
  feed: arenaFeed('search_style_control'),
  terms: ARENA_TERMS,
  aliases: ARENA_ALIASES,
  fetch: async () =>
    (await arenaRowsByCategory('search_style_control', { views: { factuality: 'search_factuality' } })).map((r) => {
      const m = r.model.match(/^(.+?)\s*\((search|grounding)(?:,\s*([^()]+))?\)$/i) ?? r.model.match(/^(.+?)[-_ ](search|grounding)$/i);
      if (!m) return r;
      const harness = m[2].toLowerCase() === 'grounding' ? 'Google Search grounding' : 'search';
      return { ...r, model: m[1].trim(), harness, ...(m[3] ? { setting: m[3].trim().toLowerCase() } : {}) };
    }),
};
export default board;
