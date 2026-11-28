// EverydayBench (Stanford University and collaborators): 77 live-web everyday delegated tasks graded by executable
// constraint checks, live source verification and human-curated rubrics. The public Stanford site renders the
// primary leaderboard as a static HTML table of 13 model and agent configurations at high reasoning effort where
// configurable. Each model cell puts the model name in the first div and the provider name in a muted sibling div.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const URL = 'https://everydaybench.stanford.edu/';

const board: Leaderboard = {
  benchmark: 'everydaybench',
  url: URL,
  feed: URL,
  terms: 'Stanford publishes the EverydayBench leaderboard on a public page with no robots.txt restrictions.',
  harnesses: 'system',
  async fetch() {
    const html = await fetchText(URL);
    const head = ['Rank', 'Model', 'Agent', 'Pass rate'];
    const table = tables(html).find((t) => head.every((h, i) => t[0]?.[i]?.text === h));
    if (!table) throw new Error('EverydayBench leaderboard table missing');
    const out: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      if (row.length < 4) continue;
      // Model cell nests provider subtitle in a secondary div; strip trailing provider name cleanly from first div
      const divs = [...row[1].html.matchAll(/<div\b[^>]*>([\s\S]*?)<\/div>/gi)]
        .map((m) => text(m[1]))
        .filter((s) => s && !/<div/i.test(s));
      let rawModel = divs.find((d) => !/^(Anthropic|OpenAI|Alibaba|Google|DeepSeek|Meta|xAI|Zhipu|Moonshot)$/i.test(d)) ?? row[1].text;
      // Fallback: if nested divs collapsed both lines, trim known trailing provider tokens
      rawModel = rawModel.replace(/\s+(Anthropic|OpenAI|Alibaba|Google|DeepSeek|Meta|xAI)$/i, '').trim();
      let setting: string | undefined;
      const eff = rawModel.match(/\s*\((High|Medium|Low)\)$/i);
      if (eff) {
        setting = `${eff[1][0].toUpperCase()}${eff[1].slice(1).toLowerCase()} effort`;
        rawModel = rawModel.slice(0, eff.index).trim();
      }
      const harness = row[2].text;
      const score = num(row[3].text);
      if (!rawModel || !harness || score === undefined) {
        throw new Error(`EverydayBench row changed: ${row.map((c) => c.text).join(' | ')}`);
      }
      out.push({
        model: rawModel,
        harness,
        score,
        ...(setting ? { setting } : {}),
      });
    }
    if (out.length < 10) throw new Error(`EverydayBench leaderboard changed: only ${out.length} rows`);
    return out;
  },
};

export default board;
