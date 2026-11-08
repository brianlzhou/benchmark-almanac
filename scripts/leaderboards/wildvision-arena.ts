// WildVision Arena paper: overall human-battle Elo.
// These static paper rows will not refresh. Model-judged WildVision-Bench scores are a different evaluation. Historical ambiguous names remain unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2406.11069";
const board: Leaderboard = {
  benchmark: "wildvision-arena",
  url: "https://arxiv.org/html/2406.11069",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables((await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,'')).find(t=>t[0]?.[2]?.text==='Elo');if(!t)throw new Error('WildVision Elo table missing');return t.slice(2).filter(r=>r.length===11).map(r=>{let name=r[0].text.replace(/\s*\[\s*\d+\s*\]/g,'');const size=r[1].text.replace(/[\s\u200B-\u200D\uFEFF]/g,'');if(/\d/.test(size))name+=' '+size;else if(/GPT|Gemini|Reka/.test(name))name+=' (snapshot unspecified)';return {model:name,score:num(r[2].text)!,metrics:{battles:num(r[3].text)!}};});
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
