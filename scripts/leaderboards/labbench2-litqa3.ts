// LABBench2 LitQA3 mean score converted to percentage, with tool/mode settings, output tokens, and duration. Empty failed runs are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://advances.edisonscientific.com/benchmarks/labbench2/litqa3/";
const board: Leaderboard = {
 benchmark: "labbench2-litqa3",
 url: "https://advances.edisonscientific.com/benchmarks/labbench2/litqa3/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=tables(await fetchText(FEED))[0];return t.slice(1).filter(r=>num(r[4]?.text)!==undefined).map(r=>{const variant=r[2].text;const tok=num(r[5].text);const dur=num(r[6].text);return {model:r[1].text.replace(/_retry$/, ''),score:num(r[4].text)!*100,setting:variant+'; mode '+r[3].text+(/_retry$/.test(r[1].text)?'; retry':''),harness:/tools/.test(variant)?'tools':undefined,tokens:tok===undefined?undefined:tok*(/k/i.test(r[5].text)?1000:1),date:r[7].text,metrics:dur===undefined?undefined:{latency:dur*(/m$/.test(r[6].text)?60:1)}};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
