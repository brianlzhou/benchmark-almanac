// DELTA ranks legal research models by task pass rate. Its published table also gives criteria pass rate, form, cost and response time.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.legalbenchmarks.ai/research/delta-dutch-legal-research-benchmark";

const board: Leaderboard = {
  stats: { criteria: { name: 'Criteria score', unit: '%', better: 'higher' }, form: { name: 'Form score', unit: 'score', better: 'higher' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  benchmark: "delta-dutch-legal-research",
  url: "https://www.legalbenchmarks.ai/research/delta-dutch-legal-research-benchmark",
  feed,
  terms: "The publisher displays results at https://www.legalbenchmarks.ai/research/delta-dutch-legal-research-benchmark. I could not verify reuse terms. The site allows this path in robots.txt.",
  chart: {
    title: 'Substance task pass rate vs. form score',
    x: { key: 'score', label: 'Task pass rate', unit: '%', better: 'higher' },
    y: { key: 'form', label: 'Form score', better: 'higher' },
    note: 'DELTA plots task pass rate on the horizontal axis against form score on the vertical axis.',
  },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => /Criteria pass\s*rate/i.test(c.text)));
    const expected = ['Rank', 'Model', 'Task pass rate', 'Criteria pass rate', 'Form', 'Cost per task', 'Response time'];
    if (!table || table.length < 24 || expected.some((v, i) => table[0][i]?.text.replace(/\s+/g, ' ') !== v)) throw new Error('Missing DELTA results or columns');
    return table.slice(1).map(cells => {
      const name = cells[1].text.replace(/\s*New$/, '').trim();
      const setting = name.startsWith('Qwen ') ? undefined : name.match(/ (Adaptive Max|Max|High)$/)?.[1];
      const model = setting ? name.slice(0, -(setting.length + 1)) : name;
      const [score, criteria, form, cost] = cells.slice(2, 6).map(c => num(c.text));
      const duration = cells[6].text.match(/^(?:(\d+)m\s*)?(\d+)s$/);
      if (!model || score == null || criteria == null || form == null) throw new Error('Incomplete DELTA result');
      return { model, setting, score, cost, metrics: { criteria, form, ...(duration ? { latency: Number(duration[1] ?? 0) * 60 + Number(duration[2]) } : {}) } };
    });
  },
};

export default board;
