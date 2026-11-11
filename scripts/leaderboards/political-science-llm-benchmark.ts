// Political Science LLM Benchmark (Hanno Hilbig, UC Davis). hannohilbig.com/llm-benchmark/ shows its
// results as SVG figures. The "Overall performance, all models" figure (figures/fig-mean-f1.svg) is drawn
// with text: each model's name on the left and its mean F1 across the 33 coding tasks printed at the right
// of the same row. Names and values are paired by their y position. The score is mean F1 x 100. Open-weight
// rows name the precision and GPU count in parentheses ("(FP8)", "(2 GPUs)"), which becomes the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://www.hannohilbig.com/llm-benchmark/';
const FEED = `${PAGE}figures/fig-mean-f1.svg`;

const board: Leaderboard = {
  benchmark: 'political-science-llm-benchmark',
  url: PAGE,
  feed: `${FEED} (row labels and mean F1 values)`,
  terms: 'Figure file on a personal academic site; robots.txt allows every path and the site states no terms.',
  chart: { title: 'Cost and performance', note: 'Source costs include conservative usage-based estimates. Values are per text classified.', x: { key: 'cost', label: 'Cost per text', unit: '$', better: 'lower', log: true }, y: { key: 'score', label: 'Mean F1', unit: '%', better: 'higher' } },
  aliases: {
    // the registry keeps one record per Qwen size, without the chat or instruct variant
    'Qwen 1.5 32B Chat': 'qwen1-5-32b',
    'Qwen 2.5 72B Instruct': 'qwen2-5-72b',
    'Qwen 2.5 32B Instruct': 'qwen2-5-32b',
    // the July 2025 instruct release (the figure does not use the thinking variant's name)
    'Qwen3 30B-A3B 2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'Mistral Small 3.1 24B': 'mistral-small-3-1',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const svg = await fetchText(FEED);
    const items = [...svg.matchAll(/<text x='([\d.]+)' y='([\d.]+)'[^>]*>([^<]+)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), s: text(m[3]) }));
    // the value column is the x position shared by the most three-decimal labels (axis ticks have two)
    const values = items.filter((e) => /^0\.\d{3}$/.test(e.s));
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v.x, (counts.get(v.x) ?? 0) + 1);
    const valueX = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? NaN;
    const rows: LeaderboardRow[] = [];
    for (const n of items.filter((e) => e.x < valueX - 50 && /[A-Za-z]/.test(e.s) && !/^Mean F1/.test(e.s))) {
      const v = values.find((e) => e.x === valueX && Math.abs(e.y - n.y) < 2);
      if (!v) continue;
      const tags = [...n.s.matchAll(/\(([^)]+)\)/g)].map((m) => m[1].toLowerCase());
      rows.push({ model: n.s.replace(/\s*\([^)]*\)/g, '').trim(), score: Number(v.s) * 100, setting: tags.join(', ') || undefined });
    }
    await new Promise(resolve => setTimeout(resolve, 1100));
    const page = await fetchText(PAGE);
    const release = page.match(/https:\/\/github\.com\/hhilbig\/polsci-open-bench\/tree\/main\/(output\/sidecar\/refresh_\d+_release_\d+)/)?.[1];
    if (!release) throw new Error('Political-science current release link missing');
    const details = parseCsv(await fetchText(`https://raw.githubusercontent.com/hhilbig/polsci-open-bench/main/${release}/models.csv`));
    const key = (name: string) => name.replace(/-1017$/, '').replace(/(jev[- ]1\.13)\.0$/i, '$1').toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const row of rows) {
      const detail = details.find(d => key(d.model) === key(row.model));
      if (!detail || !(Number(detail.n) > 0)) continue;
      const n = Number(detail.n), metrics: Record<string, number> = { texts: n };
      if (detail.cost_usd_upper?.trim()) { row.cost = Number(detail.cost_usd_upper) / n; metrics.cost = row.cost; }
      if (detail.output_tokens?.trim()) row.tokens = Number(detail.output_tokens) / n;
      if (detail.input_tokens?.trim()) metrics.inputTokens = Number(detail.input_tokens) / n;
      if (detail.task_ci_low?.trim()) metrics.ciLow = 100 * Number(detail.task_ci_low);
      if (detail.task_ci_high?.trim()) metrics.ciHigh = 100 * Number(detail.task_ci_high);
      row.metrics = metrics;
    }
    if (rows.length < 10) throw new Error(`only ${rows.length} rows read from the figure`);
    return rows;
  },
};
export default board;
