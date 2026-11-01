// ProgramBench (200 tasks). programbench.com is a static Netlify page: its leaderboard table ranks runs by
// Resolved (fully solved instances, the score) and lists Almost (95% of tests passed) and Cost (average
// USD per task); rows past 30 sit in the same HTML behind "Load more". The Pareto chart's script holds
// the same runs as a results array with calls and tokens per task. The tokens there are read as output
// tokens: runs with hundreds of calls list only hundreds of thousands, far below their input. "TBA" costs stay empty.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://programbench.com/';

const board: Leaderboard = {
  benchmark: 'programbench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Resolved, and the chart's results array)`,
  terms: 'Static page with no terms or robots.txt; the ProgramBench repository (facebookresearch/ProgramBench) is MIT.',
  aliases: {
    'GPT 6 Astra': 'gpt-6-astra',
    'GPT 5.5': 'gpt-5-5',
    'GPT 5.4': 'gpt-5-4',
    'GPT 5.4 mini': 'gpt-5-4-mini',
    'GPT 5 mini': 'gpt-5-mini',
    'Muse Wonder': 'muse-wonder',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const [t] = tables(html);
    const head = t?.[0]?.map((c) => c.text);
    if (!head || head[2] !== 'Model' || head[3] !== 'Agent' || !/^Resolved/.test(head[4]) || !/^Cost/.test(head[6])) {
      throw new Error(`unexpected ProgramBench header: ${head?.join(' | ')}`);
    }
    const chart = html.match(/var results = (\[[\s\S]*?\]);/);
    const tokens = new Map<string, number>();
    if (chart) for (const r of JSON.parse(chart[1]) as { model: string; tokens?: number | null }[]) if (r.tokens) tokens.set(r.model, r.tokens);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[2]?.text;
      const score = num(r[4]?.text);
      if (!model || score === undefined) continue;
      rows.push({ model, harness: r[3]?.text || undefined, score, cost: num(r[6]?.text), tokens: tokens.get(model) });
    }
    return rows;
  },
};
export default board;
