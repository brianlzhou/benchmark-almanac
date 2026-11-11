// CC-OCR: Total is the official aggregate percentage across four OCR task groups.
// All four task-group scores are retained. The README footnote identifies three exact API snapshots.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/AlibabaResearch/AdvancedLiterateMachinery/main/Benchmarks/CC-OCR/README.md";
const board: Leaderboard = {
 benchmark: "cc-ocr",
 url: "https://github.com/AlibabaResearch/AdvancedLiterateMachinery/tree/main/Benchmarks/CC-OCR",
 feed: FEED,
 aliases: {'gemini-1.5-pro-002': 'gemini-1-5-pro-sept-2024', 'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024'},
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Total'));
  if (!t) throw new Error('cc-ocr table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[5])!==undefined).map(r=>({
    model:r[0], score:num(r[5])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==5 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('cc-ocr has no scored rows');
  return rows;
  })();
  // The table footnote gives these API snapshots explicitly.
  const snapshots: Record<string, string> = {
    'GPT-4o': 'gpt-4o-2024-08-06',
    'Gemini-1.5-pro': 'gemini-1.5-pro-002',
    'Claude3.5-sonnet': 'claude-3-5-sonnet-20241022',
  };
  // Other undated families remain unlisted.
  return result.map(r => ({...r, model: snapshots[r.model] ?? (!r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model)}));
 },
};
export default board;
