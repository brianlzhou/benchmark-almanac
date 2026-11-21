// LongFact-Objects tests factual claims about named subjects. Figures 2 and 3 of the GPT-5 System Card give the claim-level error rate with browsing enabled and disabled.
// The importer checks the source file hash before using the values printed in the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = "https://cdn.openai.com/gpt-5-system-card.pdf";
const rows: LeaderboardRow[] = [
  {"model": "gpt-5-thinking", "score": 0.8, "setting": "Browsing Enabled"},
  {"model": "gpt-5-thinking-mini", "score": 0.8, "setting": "Browsing Enabled"},
  {"model": "gpt-5-thinking-nano", "score": 1.9, "setting": "Browsing Enabled"},
  {"model": "OpenAI o3", "score": 5.1, "setting": "Browsing Enabled"},
  {"model": "OpenAI o4-mini", "score": 4.1, "setting": "Browsing Enabled"},
  {"model": "gpt-5-thinking", "score": 1.4, "setting": "Browsing Disabled"},
  {"model": "gpt-5-thinking-mini", "score": 1.8, "setting": "Browsing Disabled"},
  {"model": "gpt-5-thinking-nano", "score": 3.1, "setting": "Browsing Disabled"},
  {"model": "OpenAI o3", "score": 7.9, "setting": "Browsing Disabled"},
  {"model": "OpenAI o4-mini", "score": 9.6, "setting": "Browsing Disabled"},
  {"model": "gpt-5-main", "score": 1.3, "setting": "Browsing Disabled"},
  {"model": "GPT-4o", "score": 1.1, "setting": "Browsing Disabled"},
];

const board: Leaderboard = {
  benchmark: "longfact-objects",
  url: "https://cdn.openai.com/gpt-5-system-card.pdf",
  terms: "OpenAI publishes the system card on its CDN. The CDN returned 404 for robots.txt. OpenAI terms apply.",
  host: "OpenAI",
  aliases: {"gpt-5-thinking-mini": "gpt-5-mini", "gpt-5-thinking-nano": "gpt-5-nano", "gpt-5-main": "gpt-5-chat"},
  feed: FEED,
  fetch: () => chartRows(FEED, "f9f9c72d08cba81dcbb189129119357c8c32eca4e0b16c813aca386aed6b0459", rows),
};
export default board;
