// HarnessDev paper: published Avg score across four downstream benchmarks in Creation, with execution token totals per harness.
// These static paper rows will not refresh. Self-Eval and Unified-Eval apply to the whole generated harness. Seed and mixed-model baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://arxiv.org/html/2609.01437";
const board: Leaderboard = {
  benchmark: "harnessdev", static: 'paper',
  parts: {
    swePro: { name: 'SWE-bench Pro', group: 'Category' },
    terminalBench: { name: 'Terminal-Bench', group: 'Category' },
    eqBench: { name: 'EQ-Bench', group: 'Category' },
    browseComp: { name: 'BrowseComp', group: 'Category' },
  },
  url: "https://arxiv.org/html/2609.01437",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const html = (await fetchText(FEED)).replace(/<annotation\b[\s\S]*?<\/annotation>/g, '');
      const result: LeaderboardRow[] = [];
      for (const table of tables(html)) {
        const track = table[1]?.[0]?.text.match(/^Creator \(\s*(Self-Eval|Unified-Eval)\s*\)$/);
        if (!track) continue;
        for (const row of table.slice(2)) {
          if (row.length !== 12 || /Seed harness|Human harness/.test(row[0].text)) continue;
          const metrics: Record<string, number> = {};
          for (const [index, key] of ['swePro', 'terminalBench', 'mleBench', 'eqBench', 'browseComp'].entries()) {
            const score = num(row[1 + 2 * index].text);
            const millions = num(row[2 + 2 * index].text);
            if (score !== undefined) metrics[key] = score;
            if (millions !== undefined) metrics[key + 'TokensPerHarness'] = millions * 1e6;
          }
          result.push({
            model: row[0].text.replace(/ High$/, ''),
            setting: track[1] + (row[0].text.endsWith(' High') ? ', high effort' : ''),
            score: num(row[11].text)!, trials: 3, metrics,
          });
        }
      }
      return result;
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
