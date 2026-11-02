// IMC 2025 on MathArena (human-graded proofs, percent of points). Only three Gemini systems were graded, and
// MathArena names the scaffold inside the model name: "Gemini 2.5 Pro (agent)" becomes the harness "agent" and
// "(best-of-32)" the setting. The contest ran in late July 2025, when the GA Gemini 2.5 Pro (June 2025) was the
// only public 2.5 Pro. "Gemini IMO Deep Think" is Google's unreleased IMO model and stays unmatched. Read
// through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'imc--imc_2025';

const board: Leaderboard = {
  benchmark: 'imc-2025',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: { ...MATHARENA_ALIASES, 'Gemini 2.5 Pro': 'gemini-2-5-pro-jun-2025' },
  async fetch() {
    return (await matharenaRows(COMP)).map((r) => {
      const m = r.model.match(/^(.*?)\s*\((agent|best-of-\d+)\)$/);
      if (!m) return r;
      return m[2] === 'agent' ? { ...r, model: m[1], harness: 'agent' } : { ...r, model: m[1], setting: m[2] };
    });
  },
};
export default board;
