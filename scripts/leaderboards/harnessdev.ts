// HarnessDev paper: published Avg score across five downstream benchmarks in Creation.
// These static paper rows will not refresh. Self-Eval and Unified-Eval apply to the whole generated harness. Seed and mixed-model baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2609.01437";
const board: Leaderboard = {
  benchmark: "harnessdev",
  url: "https://arxiv.org/html/2609.01437",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const ts=tables((await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g,''));return ts.filter(t=>/^Creator \(\s*(Self|Unified)-Eval\s*\)$/.test(t[1]?.[0]?.text||'')).flatMap(t=>t.slice(2).filter(r=>r.length===12&&!/Seed harness|Human harness/.test(r[0].text)).map(r=>({model:r[0].text.replace(/ High$/,''),setting:t[1][0].text.match(/\(([^)]+)\)/)![1]+(r[0].text.endsWith(' High')?', high effort':''),score:num(r[11].text)!,metrics:{swePro:num(r[1].text)!,terminalBench:num(r[3].text)!,mleBench:num(r[5].text)!,eqBench:num(r[7].text)!,browseComp:num(r[9].text)!}})));
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
