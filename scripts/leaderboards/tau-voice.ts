// τ-Voice, shown on taubench.com as the "τ³-Voice" tab. The site reads the same public S3 bucket as the
// text boards: manifest.json lists the voice runs under "voice_submissions", and the tab's default
// Overall is the mean pass^1 of retail, airline and telecom (a row needs all three). Custom-scaffold runs,
// including those with a non-standard user simulator, are hidden by default on the site and left out
// here, as in the text boards. The reader lives in tau2-bench.ts. The tab's interaction columns come from
// each submission's interaction_metrics.overall: Latency (response_latency_mean, seconds, as `latency`),
// Responsiveness (response_rate), Interrupts (agent_interruption_rate) and Selectivity (the mean of the three
// selectivity rates, shown only when each has at least 10 events), all three as percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { ALIASES, TERMS, loadTau, overall, row } from './tau2-bench.ts';

// loadTau is typed for the text keys, but voice runs sit in the same manifest with the same layout
const VOICE = 'voice_submissions' as 'submissions';

interface Interaction {
  response_latency_mean?: number;
  response_rate?: number;
  agent_interruption_rate?: number;
  selectivity_backchannel?: number;
  selectivity_vocal_tic?: number;
  selectivity_non_directed?: number;
  counts?: Record<string, number>;
}

/** The voice tab's interaction columns, as the site computes them from interaction_metrics.overall. */
function interaction(o: Interaction | undefined): Record<string, number> | undefined {
  if (!o) return undefined;
  const m: Record<string, number> = {};
  if (typeof o.response_latency_mean === 'number') m.latency = o.response_latency_mean;
  if (typeof o.response_rate === 'number') m.responsiveness = o.response_rate * 100;
  if (typeof o.agent_interruption_rate === 'number') m.interrupts = o.agent_interruption_rate * 100;
  // the site shows Selectivity only when all three event types have at least 10 events
  const sel = (['backchannel', 'vocal_tic', 'non_directed'] as const).map((k) =>
    typeof o[`selectivity_${k}`] === 'number' && (o.counts?.[`${k}_total`] ?? 0) >= 10 ? o[`selectivity_${k}`]! : undefined,
  );
  if (sel.every((v) => v !== undefined)) m.selectivity = (100 * sel.reduce((a, b) => a! + b!, 0)!) / 3;
  return Object.keys(m).length ? m : undefined;
}

const board: Leaderboard = {
  benchmark: 'tau-voice',
  url: 'https://taubench.com/leaderboard?benchmark=voice',
  feed: 'https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json (voice_submissions)',
  terms: TERMS,
  aliases: {
    ...ALIASES,
    // OpenAI's first GA realtime model (August 2025), named gpt-realtime-1.0 once 1.5 and 2 followed
    'gpt-realtime-1.0': 'gpt-realtime',
    // the realtime endpoint of Qwen3.5-Omni-Plus
    'qwen3.5-omni-plus-realtime': 'qwen3-5-omni-plus',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const s of await loadTau(VOICE)) {
      const score = overall(s);
      const metrics = interaction((s as { interaction_metrics?: { overall?: Interaction } }).interaction_metrics?.overall);
      if (score !== null) rows.push({ ...row(s, score), metrics });
    }
    return rows;
  },
};
export default board;
