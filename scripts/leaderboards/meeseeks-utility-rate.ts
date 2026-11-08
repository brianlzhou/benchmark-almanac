// Meeseeks paper: utility rate after a 20-turn feedback budget, multiplied by 100.
// These static paper rows will not refresh. A turn budget applies to every example, not a subtask.
// Thinking and high-effort modes stay in setting alongside the turn budget, preventing duplicate resolved configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2504.21625";
const board: Leaderboard = {
  benchmark: "meeseeks-utility-rate",
  url: "https://arxiv.org/html/2504.21625",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='11'&&t[0]?.at(-1)?.text==='20');
      if(!t)throw new Error('Meeseeks final-turn table missing');
      return t.slice(1).filter(r=>r.length===11).map(r=>{const raw=r[0].text.replace(/^[^/]+\//,'').replace(/[*†]/g,'').trim();const effort=raw.match(/(?:[ -](Thinking|think)|\s*\((high)\))$/i);const mode=effort?(effort[2]?'high':'thinking'):undefined;return {model:effort?raw.slice(0,effort.index).trim():raw,score:Number(r[10].text.replace(/[^\d.]/g,''))*100,setting:'20-turn feedback budget'+(mode?', '+mode:'')};});
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
