// AssistantBench: official test accuracy, with GPT4-T as the shared backbone.
// Agent methods remain harnesses. The publisher does not identify an exact GPT-4 Turbo snapshot, so rows stay unlisted.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://assistantbench.github.io";
const board: Leaderboard = {
  benchmark: "assistantbench",
  url: "https://assistantbench.github.io",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Model'&&t[0]?.[1]?.text==='Accuracy');if(!t)throw new Error('AssistantBench table missing');return t.slice(1).filter(r=>r.length===5).map(r=>({model:'GPT-4 Turbo (snapshot unspecified)',harness:r[0].text,score:num(r[1].text)!,metrics:{answerRate:num(r[2].text)!,precision:num(r[3].text)!,exactMatch:num(r[4].text)!}}));
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
