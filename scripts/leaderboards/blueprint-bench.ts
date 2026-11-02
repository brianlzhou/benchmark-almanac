// Blueprint-Bench (the first version, replaced by Blueprint-Bench 2 in 2026-05) on andonlabs.com. The eval
// page is server-rendered with one table: rank | Model | Type | Similarity Score (mean), a similarity of the
// model's floor plans to the true ones from 0 to 1. The almanac records this version in the board's own
// unit (score), so the value is kept as shown. The human baseline row is skipped. The reader lives in
// visulogic.ts.
import type { Leaderboard } from './types.ts';
import { tableRows } from './visulogic.ts';

const URL = 'https://andonlabs.com/evals/blueprint-bench';

const board: Leaderboard = {
  benchmark: 'blueprint-bench',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Server-rendered public page of andonlabs.com; the site publishes no terms of use or robots.txt, so the scores are cited to Andon Labs.',
  aliases: {
    // agent rows name the model inside the agent
    'Codex CLI (GPT-5)': 'gpt-5',
    'Claude Code (Opus 4)': 'claude-opus-4',
  },
  fetch: () => tableRows(URL, { model: /^Model$/i, score: /^Similarity Score/i, harness: /^Type$/i, skip: /^(Human|Random)/i }),
};
export default board;
