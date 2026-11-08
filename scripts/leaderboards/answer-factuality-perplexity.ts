// Perplexity answer factuality: Factuality is the whole-benchmark headline.
// Readability, IFEval and MMLU are separate evaluations and are excluded.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://cdn.sanity.io/images/aqo64vfr/production/a41eb1f0e165d9b09e03c0276198bd5ea5fa7027-3840x2288.png?w=2640&q=80&fit=max&auto=format
// SHA-256: 174c848580e5e86aaae15137c42e474727da65ebecfc64670ab410c01c15e908
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://cdn.sanity.io/images/aqo64vfr/production/a41eb1f0e165d9b09e03c0276198bd5ea5fa7027-3840x2288.png?w=2640&q=80&fit=max&auto=format (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "answer-factuality-perplexity",
 url: "https://cdn.sanity.io/images/aqo64vfr/production/a41eb1f0e165d9b09e03c0276198bd5ea5fa7027-3840x2288.png?w=2640&q=80&fit=max&auto=format",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://cdn.sanity.io/images/aqo64vfr/production/a41eb1f0e165d9b09e03c0276198bd5ea5fa7027-3840x2288.png?w=2640&q=80&fit=max&auto=format", "174c848580e5e86aaae15137c42e474727da65ebecfc64670ab410c01c15e908", [
  {
    "model": "Sonar",
    "score": 85.1
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 83.9
  },
  {
    "model": "Gemini 2.0 Flash",
    "score": 78.5
  },
  {
    "model": "Claude 3.5 Sonnet (snapshot unspecified)",
    "score": 75.8
  },
  {
    "model": "Claude 3.5 Haiku",
    "score": 71.7
  },
  {
    "model": "GPT-4o mini (snapshot unspecified)",
    "score": 61.4
  },
  {
    "model": "Llama 3.3 70B Instruct",
    "score": 65.7
  }
]));
 },
};
export default board;
