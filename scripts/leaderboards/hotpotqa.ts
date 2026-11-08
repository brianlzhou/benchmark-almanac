// HotpotQA: headline Joint F1 in the first, Distractor leaderboard.
// Answer and supporting-fact scores remain metrics. The fullwiki leaderboard is a separate task and is excluded. Repeated system submissions keep the latest submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://hotpotqa.github.io/";
const board: Leaderboard = {
  benchmark: "hotpotqa",
  url: "https://hotpotqa.github.io/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Joint'));
      if(!t)throw new Error('HotpotQA distractor board missing');
      const parsed = t.slice(2).filter(r=>r.length===9&&num(r[8].text)!==undefined).map(r=>({model:text(r[1].html.split(/<br\b/i)[0]),score:num(r[8].text)!,date:new Date(r[0].text.replace(/^\d+\s+/, '')).toISOString().slice(0,10),metrics:{answerEM:num(r[3].text)!,answerF1:num(r[4].text)!,supportEM:num(r[5].text)!,supportF1:num(r[6].text)!,jointEM:num(r[7].text)!}}));
      const latest=new Map<string,LeaderboardRow>(); for(const r of parsed){if(!latest.has(r.model)||r.date!>latest.get(r.model)!.date!)latest.set(r.model,r);} return [...latest.values()];
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
