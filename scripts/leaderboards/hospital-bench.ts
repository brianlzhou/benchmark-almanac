// Hospital-bench (Zavo): agents run a simulated health system's operations desk through 131 tools in 13 apps, graded by
// deterministic checks on the final state. The results post has a score and cost table (Score, Passes, Cost / task,
// Turns / task, Tool calls / task, Output tokens / task) and, in Figure 1, each model's 95% interval of the mean from
// resampling tasks. All 23 models ran the 48 tasks at high reasoning effort, so no row carries a setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const URL = 'https://zavo.ai/research/hospital-bench';

const board: Leaderboard = {
  benchmark: 'hospital-bench',
  url: URL,
  feed: URL,
  terms: 'Zavo’s robots.txt allows every crawler on its pages (Content-Signal search=yes, ai-train=no). We read only the published results table.',
  stats: {
    passes: { name: 'Tasks passed', unit: 'count', better: 'higher', note: 'Tasks, of 48, on which every check holds.' },
    turns: { name: 'Turns per task', unit: 'count' },
    toolCalls: { name: 'Tool calls per task', unit: 'count' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const head = ['Model', 'Score', 'Passes', 'Cost / task', 'Turns / task', 'Tool calls / task', 'Output tokens / task'];
    const table = tables(html).find(t => head.every((h, i) => t[0]?.[i]?.text === h));
    if (!table) throw new Error('Hospital-bench score and cost table missing');
    // Figure 1: "<span class="hb-board-name">…GPT-6.2 Astra</span> … 95% interval 53.0% to 71.3%"
    const intervals = new Map<string, [number, number]>();
    for (const m of html.matchAll(/<span class="hb-board-name">([\s\S]*?)<\/span>[\s\S]*?95% interval (\d+(?:\.\d+)?)% to (\d+(?:\.\d+)?)%/g))
      intervals.set(text(m[1]), [Number(m[2]), Number(m[3])]);
    const out: LeaderboardRow[] = table.slice(1).map(row => {
      const [model, score, passes, cost, turns, toolCalls, tokens] = row.map(c => c.text);
      const values = [score, passes, turns, toolCalls].map(num);
      if (!model || values.some(v => v === undefined)) throw new Error(`Hospital-bench row changed: ${model}`);
      // the table gives LingSante-3.1-flash's cost as "Free", which is no cost figure, so the row keeps none rather than 0
      if (cost !== 'Free' && num(cost) === undefined) throw new Error(`Hospital-bench cost changed: ${model} ${cost}`);
      const ci = intervals.get(model);
      return {
        model,
        score: values[0]!,
        ...(ci ? { low: ci[0], high: ci[1] } : {}),
        ...(cost === 'Free' ? {} : { cost: num(cost) }),
        tokens: kilo(tokens),
        metrics: { passes: values[1]!, turns: values[2]!, toolCalls: values[3]! },
      };
    });
    if (out.length < 23) throw new Error(`Hospital-bench table changed: only ${out.length} rows`);
    if (out.filter(r => r.low === undefined).length) throw new Error('Hospital-bench intervals missing for some models');
    return out;
  },
};

/** "8.7k" -> 8700 */
function kilo(s: string | undefined): number | undefined {
  const m = s?.match(/^(\d+(?:\.\d+)?)(k?)$/i);
  return m ? Math.round(Number(m[1]) * (m[2] ? 1000 : 1)) : undefined;
}

export default board;
