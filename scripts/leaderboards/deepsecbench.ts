// DeepsecBench (Vercel). vercel.com/ai-gateway/leaderboards/deepsecbench is server-rendered (Next.js) with
// one HTML table: model (display name, effort, then the gateway slug such as "openai/gpt-6-sol"), Score
// (recall-weighted F2, the ranking), recall, precision, false positives, cost, time, tokens and harness. The
// slug is the name read, the effort the setting and the harness kept. Cost is the total for the whole
// review run, so it is kept with costPer 'run'. Metrics: recall and precision (percent), false positives
// (`fp`), total time in hours (`runHours`), which the board's "Score vs. total time" Pareto chart plots, and
// the run's total tokens in thousands (`tokensK`, all tokens, so not the per-task output tokens).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://vercel.com/ai-gateway/leaderboards/deepsecbench';

const board: Leaderboard = {
  benchmark: 'deepsecbench',
  url: URL,
  feed: `${URL} (server-rendered HTML table, Score)`,
  terms: 'Server-rendered public page; robots.txt allows /ai-gateway/leaderboards and the Vercel terms do not restrict reading it.',
  costPer: 'run',
  chart: {
    title: 'Score vs. total time',
    note: 'Each point is one model configuration; the Pareto frontier joins configurations that no other beats on both score and total time.',
    x: { key: 'runHours', label: 'Total time', unit: 'h', better: 'lower' },
    y: { key: 'score', label: 'Score', better: 'higher' },
  },
  aliases: {},
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => c.text === 'Score'));
    if (!t) throw new Error('DeepsecBench table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iScore, iHarness] = [head.indexOf('Model'), head.indexOf('Score'), head.indexOf('Harness')];
    const col = (re: RegExp) => head.findIndex((h) => re.test(h));
    const [iRecall, iPrecision, iFp, iCost, iTime, iTokens] = [/^Recall/, /^Precision/, /^FP$/, /^Cost/, /time/i, /^Tokens/].map(col);
    // "1h 09m 09s", "49m 47s": hours
    const hours = (t?: string) => {
      const m = t?.match(/^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/);
      return m && (m[1] || m[2] || m[3]) ? Number(m[1] ?? 0) + Number(m[2] ?? 0) / 60 + Number(m[3] ?? 0) / 3600 : undefined;
    };
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const cell = r[iModel]?.html ?? '';
      const spans = [...cell.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => text(m[1]));
      const slug = spans.find((s) => /^[\w.-]+\/[\w.:-]+$/.test(s));
      const effort = spans.find((s) => /^(none|minimal|low|medium|high|xhigh|max)$/i.test(s));
      const name = slug ?? text(cell);
      // the slug is the gateway's. A date-stamped variant such as "deepseek-v4.1-flash-1017" keeps its stamp
      const score = num(r[iScore]?.text);
      if (!name || score === undefined) continue;
      const at = (i: number) => (i < 0 ? undefined : num(r[i]?.text));
      const metrics: Record<string, number> = {};
      for (const [k, v] of [['recall', at(iRecall)], ['precision', at(iPrecision)], ['fp', at(iFp)], ['runHours', iTime < 0 ? undefined : hours(r[iTime]?.text.trim())], ['tokensK', at(iTokens)]] as const)
        if (v !== undefined) metrics[k] = v;
      rows.push({ model: name, score, setting: effort?.toLowerCase(), harness: r[iHarness]?.text || undefined, cost: at(iCost), metrics });
    }
    return rows;
  },
};
export default board;
