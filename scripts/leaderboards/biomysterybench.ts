// BioMysteryBench on Vals AI. Accuracy is the percentage of v11 bioinformatics investigations whose final
// conclusion the judge accepted, averaged over three full runs on the 90-task release updated 2026-10-29.
// Labs report human-solvable and human-difficult splits separately; Vals reports the full benchmark aggregate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { VALS_LATENCY_CHART, valsView } from './vals-index.ts';

interface BioTurnMetrics {
  avg_turns?: number | null;
  avg_query_seconds?: number | null;
  median_query_seconds?: number | null;
  avg_ttft_seconds?: number | null;
}

const FEED = 'https://www.vals.ai/benchmarks/biomysterybench';
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 1000) / 1000));

const board: Leaderboard = {
  benchmark: 'biomysterybench',
  host: 'Vals AI',
  url: FEED,
  feed: FEED,
  reference: ['Vals AI'],
  aliases: {
    'Gemini 3.1 Pro Preview (02/26)': 'gemini-3-1-pro',
    Wonder: 'muse-wonder',
  },
  terms: 'Vals AI publishes public benchmark results and methodology. The almanac credits and links Vals AI and follows its source terms.',
  stats: {
    time: { name: 'Time', unit: 'seconds', better: 'lower' },
    totalTokens: { name: 'Total tokens', unit: 'tokens' },
    turns: { name: 'Mean turns per test', unit: 'count', better: 'lower' },
    avgQuerySeconds: { name: 'Mean query latency', unit: 'seconds', better: 'lower' },
    medianQuerySeconds: { name: 'Median query latency', unit: 'seconds', better: 'lower' },
    avgTtftSeconds: { name: 'Mean time to first token', unit: 'seconds', better: 'lower' },
  },
  chart: { ...VALS_LATENCY_CHART, x: { ...VALS_LATENCY_CHART.x, key: 'time' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const view = await valsView(html);
    const table = tables(html).find((t) => t[0]?.some((c) => c.text === 'Accuracy'));
    if (!table) throw new Error('BioMysteryBench Vals table missing');
    const headers = table[0].map((c) => c.text);
    const model = headers.indexOf('Model');
    const score = headers.indexOf('Accuracy');
    const cost = headers.indexOf('Cost / Test');
    const duration = headers.indexOf('Duration / Test');
    if (model < 0 || score < 0) throw new Error('BioMysteryBench Vals columns missing');
    const rows = table.slice(1).flatMap((r) => {
      const value = num(r[score]?.text);
      const name = r[model]?.text.trim();
      const parts = r[duration]?.text.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/);
      const time = parts && parts[0] ? Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0) : undefined;
      const slug = r[model]?.html.match(/href="\/models\/([^"#]+)"/)?.[1];
      const run = slug ? view?.tasks?.overall?.[slug.replace('_', '/')] : undefined;
      const matched = value !== undefined && run?.accuracy != null && Math.abs(run.accuracy - value) < 0.006 ? run : undefined;
      const measured = matched?.token_tasks_measured ?? view?.metadata?.token_tasks_measured;
      const output = matched?.avg_output_tokens ?? (measured && matched?.token_totals?.output_tokens != null ? matched.token_totals.output_tokens / measured : undefined);
      const total = r[headers.indexOf('Tokens / Test')]?.text.match(/^([\d.,]+)([kKmM]?)$/);
      const metrics: Record<string, number> = {};
      if (total) metrics.totalTokens = Number(total[1].replace(/,/g, '')) * ({ k: 1e3, m: 1e6 }[total[2].toLowerCase()] ?? 1);
      if (time !== undefined) metrics.time = time;
      if (matched?.stderr != null && Number.isFinite(matched.stderr)) metrics.stderr = matched.stderr;
      const tm = matched?.turn_metrics as BioTurnMetrics | null | undefined;
      if (typeof tm?.avg_turns === 'number' && Number.isFinite(tm.avg_turns)) metrics.turns = tm.avg_turns;
      if (typeof tm?.avg_query_seconds === 'number' && Number.isFinite(tm.avg_query_seconds)) metrics.avgQuerySeconds = tm.avg_query_seconds;
      if (typeof tm?.median_query_seconds === 'number' && Number.isFinite(tm.median_query_seconds)) metrics.medianQuerySeconds = tm.median_query_seconds;
      if (typeof tm?.avg_ttft_seconds === 'number' && Number.isFinite(tm.avg_ttft_seconds)) metrics.avgTtftSeconds = tm.avg_ttft_seconds;
      const hasCi = matched?.stderr != null && Number.isFinite(matched.stderr) && matched.stderr > 0;
      return name && value !== undefined
        ? [{
            model: name,
            score: value,
            setting: 'Vals AI harness, v11 full set',
            cost: num(r[cost]?.text),
            harness: 'Vals AI',
            trials: 3,
            tokens: output,
            ...(slug ? { link: `https://www.vals.ai/models/${slug}` } : {}),
            ...(hasCi ? { low: clamp(matched!.accuracy! - 1.96 * matched!.stderr!), high: clamp(matched!.accuracy! + 1.96 * matched!.stderr!) } : {}),
            metrics,
          }]
        : [];
    });
    if (!rows.length) throw new Error('BioMysteryBench Vals rows missing');
    return rows;
  },
};
export default board;
