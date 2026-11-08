// Windows Agent Arena: Total task success rate across all domains.
// Six perception configurations cover the whole benchmark. Human performance is a reference only.
// Rows were transcribed twice from printed chart labels on 2026-11-08.
// Image: https://microsoft.github.io/WindowsAgentArena/static/images/results.png
// SHA-256: b494ceec30c4285b8da217d7c720206bbed104587a97a420fd9e009395d589fc
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';
import { chartRows } from '../lib/boards/verified-chart-h2.ts';
const FEED = "https://microsoft.github.io/WindowsAgentArena/static/images/results.png (transcribed 2026-11-08)";
const board: Leaderboard = {
 benchmark: "windows-agent-arena",
 url: "https://microsoft.github.io/WindowsAgentArena/static/images/results.png",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
return checked(await chartRows("https://microsoft.github.io/WindowsAgentArena/static/images/results.png", "b494ceec30c4285b8da217d7c720206bbed104587a97a420fd9e009395d589fc", [
  {
    "model": "Phi3-V",
    "score": 1.3,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 7.2,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 5.2,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 8.6,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA off",
    "harness": "Navi"
  },
  {
    "model": "Phi3-V",
    "score": 2.0,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 2.6,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 9.8,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 13.1,
    "setting": "Pytesseract + DOM, Grounding DINO, UIA on",
    "harness": "Navi"
  },
  {
    "model": "Phi3-V",
    "score": 3.2,
    "setting": "OneOCR, proprietary detection, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 5.3,
    "setting": "OneOCR, proprietary detection, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 9.3,
    "setting": "OneOCR, proprietary detection, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 11.3,
    "setting": "OneOCR, proprietary detection, UIA off",
    "harness": "Navi"
  },
  {
    "model": "Phi3-V",
    "score": 4.0,
    "setting": "OneOCR, proprietary detection, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 7.3,
    "setting": "OneOCR, proprietary detection, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 13.3,
    "setting": "OneOCR, proprietary detection, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 13.1,
    "setting": "OneOCR, proprietary detection, UIA on",
    "harness": "Navi"
  },
  {
    "model": "Phi3-V",
    "score": 2.0,
    "setting": "Omniparser, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 2.7,
    "setting": "Omniparser, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 9.4,
    "setting": "Omniparser, UIA off",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 12.5,
    "setting": "Omniparser, UIA off",
    "harness": "Navi"
  },
  {
    "model": "Phi3-V",
    "score": 3.5,
    "setting": "Omniparser, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o-mini (snapshot unspecified)",
    "score": 4.2,
    "setting": "Omniparser, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4o (snapshot unspecified)",
    "score": 8.6,
    "setting": "Omniparser, UIA on",
    "harness": "Navi"
  },
  {
    "model": "GPT-4V-1106",
    "score": 19.5,
    "setting": "Omniparser, UIA on",
    "harness": "Navi"
  }
]));
 },
};
export default board;
