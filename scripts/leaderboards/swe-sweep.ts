// SWE-sweep on swesweep.com. The page is static HTML with one leaderboard table: Rank | Model | Agent |
// Bugs resolved | Total USD | USD / repo | Turns / repo | Tokens / repo. Bugs resolved (share of the 4.1k
// bugs fixed, 0 to 100) is the score, and USD / repo is the cost of one task (each task is one repository).
// The model cell holds the name ("Sol 5.6 (xhigh)") and the maker in separate spans; the effort in
// parentheses becomes the setting. The board names OpenAI and Anthropic models by their short names
// ("Astra 6", "Opus 5.5"), which the aliases place. The reader lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://swesweep.com/';

const board: Leaderboard = {
  benchmark: 'swe-sweep',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static public page; the site has no robots.txt and no terms, and the harness runs through the open Harbor framework.',
  aliases: {
    'Astra 6': 'gpt-6-astra',
    'Sol 5.6': 'gpt-5-6-sol',
    'Luna 5.6': 'gpt-5-6-luna',
    'Terra 5.6': 'gpt-5-6-terra',
    'Opus 5.5': 'claude-opus-5-5',
    'Opus 5': 'claude-opus-5',
    'Fable 5.1': 'claude-fable-5-1',
  },
  async fetch() {
    const rows = await tableRows(URL, {
      model: /^Model$/i,
      score: /^Bugs resolved/i,
      harness: /^Agent$/i,
      cost: /^USD \/ repo$/i,
      name: (c) => text(c.html.match(/class="model-name"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? c.text),
    });
    return rows.map((r) => {
      const effort = r.model.match(/\s*\(([^()]+)\)$/);
      return effort ? { ...r, model: r.model.slice(0, effort.index).trim(), setting: effort[1].toLowerCase() } : r;
    });
  },
};
export default board;
