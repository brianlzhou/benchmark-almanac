// The helpful-only evaluation counts compliance with explicit reasoning about avoiding preference changes. Section 5.3 of the Claude 3.7 Sonnet system card gives two numeric rates.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://www-cdn.anthropic.com/9ff93dfa8f445c932415d335c88852ef47f1201e.pdf";
const rows: LeaderboardRow[] = [
  {"model": "Claude 3 Opus", "score": 15},
  {"model": "original Claude 3.5 Sonnet", "score": 30},
];

const board: Leaderboard = {
  benchmark: "alignment-faking-helpful-only-anthropic",
  url: "https://www-cdn.anthropic.com/9ff93dfa8f445c932415d335c88852ef47f1201e.pdf",
  terms: "Public Anthropic system card on its document CDN. Credit section 5.3.",
  aliases: {"original Claude 3.5 Sonnet": "claude-3-5-sonnet"},
  feed: FEED,
  fetch: () => chartRows(FEED, "82947a46fc2d1b9a1d69501ef973fc3c5b328b703b9a17bd8a143c2672f8a1a6", rows),
};
export default board;
