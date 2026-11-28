// HealthBench Consensus Global Health measures failures to adapt to ambiguous local health context. Figure 7 of the GPT-5 System Card reports the error rate for seven models.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://cdn.openai.com/gpt-5-system-card.pdf";
const rows: LeaderboardRow[] = [
  {"model": "gpt-5-thinking", "score": 0},
  {"model": "OpenAI o3", "score": 6.2},
  {"model": "gpt-5-thinking-mini", "score": 0.5},
  {"model": "OpenAI o4-mini", "score": 10.3},
  {"model": "OpenAI o1", "score": 7.1},
  {"model": "gpt-5-main", "score": 5.3},
  {"model": "gpt-4o", "score": 13.7},
];

const board: Leaderboard = {
  benchmark: "healthbench-consensus-global-health",
  static: 'paper',
  url: "https://cdn.openai.com/gpt-5-system-card.pdf",
  terms: "OpenAI publishes the system card on its CDN. The CDN returned 404 for robots.txt. OpenAI terms apply.",
  aliases: {"gpt-5-thinking-mini": "gpt-5-mini", "gpt-5-main": "gpt-5-chat"},
  feed: FEED,
  fetch: () => chartRows(FEED, "f9f9c72d08cba81dcbb189129119357c8c32eca4e0b16c813aca386aed6b0459", rows),
};
export default board;
