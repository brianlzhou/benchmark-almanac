// ATLAS-Finance: task pass rate, distinct from rubric score and pass@3.
// The official table reports per-task dollars, output tokens, input tokens, and elapsed time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const PAGE = 'https://joinhandshake.com/research/benchmarks/atlas-finance/';
const count = (s: string) => { const n = num(s); return n === undefined ? undefined : n * (/M$/i.test(s) ? 1e6 : /K$/i.test(s) ? 1e3 : 1); };
const board: Leaderboard = {
  benchmark: 'atlas-finance', url: PAGE, feed: PAGE,
  terms: 'Handshake terms restrict automated extraction. Benchmark Almanac credits Handshake and links the original source.',
  chart: { title: 'Pass rate versus task cost', x: { key: 'cost', label: 'Cost per task', unit: '$', better: 'lower' }, y: { key: 'score', label: 'Pass rate', unit: '%', better: 'higher' } },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find(t => t[0]?.some(c => c.text === 'Pass Rate'));
    if (!t) throw new Error('ATLAS-Finance results table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[1]?.text);
      if (score === undefined) continue;
      const m = r[0].text.match(/^(.*?)\s+(?:Anthropic|OpenAI|Google|DeepSeek|Moonshot(?: AI)?|Alibaba|Z[ .]AI|xAI|Meta)\s*·\s*(.*)$/);
      const metrics: Record<string, number> = {};
      for (const [key, value] of [['ciMargin', num(r[2]?.text)], ['pass3', num(r[3]?.text)], ['rubric', num(r[4]?.text)], ['minutes', num(r[6]?.text)], ['inputTokens', count(r[7]?.text ?? '')]] as const) if (value !== undefined) metrics[key] = value;
      rows.push({ model: m?.[1] || r[0].text, setting: m?.[2]?.toLowerCase(), score, cost: num(r[5]?.text), tokens: count(r[8]?.text ?? ''), metrics });
    }
    if (!rows.length) throw new Error('No ATLAS-Finance scores');
    return rows;
  },
};
export default board;
