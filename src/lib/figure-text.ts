// The words a downloaded chart carries so it explains itself away from the page: what benchmark or index it is,
// who made it, what the number measures, and what the chart counts and leaves out
// (src/components/ChartDownload.astro prints them in the file).
import type { Benchmark } from './types.ts';

const and = (s: string) => s.replace(/\s*\+\s*/g, ' and ');

/** The first sentence or two of a catalog description, up to about 190 characters. */
export function shortDescription(desc?: string, max = 190): string {
  if (!desc) return '';
  const sentences = desc.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [desc.trim()];
  let out = '';
  for (const s of sentences) {
    if (out && (out + ' ' + s).length > max) break;
    out = out ? `${out} ${s}` : s;
  }
  return out.length > max + 60 ? `${out.slice(0, max).replace(/\s+\S*$/, '')}…` : out;
}

const UNIT_WORDS: Record<string, string> = {
  '%': 'Scores are percentages',
  score: 'Scores are on the benchmark’s own scale',
  elo: 'Scores are Elo ratings',
  rating: 'Scores are ratings',
  index: 'Scores are index points',
  speedup: 'Scores are speedups over a baseline',
  usd: 'Scores are US dollars',
  minutes: 'Scores are minutes',
  brier: 'Scores are Brier scores',
};
const UNIT_AXIS: Record<string, string> = {
  '%': 'Score (%)',
  score: 'Score',
  elo: 'Elo rating',
  rating: 'Rating',
  index: 'Index points',
  speedup: 'Speedup',
  usd: 'US dollars',
  minutes: 'Minutes',
  brier: 'Brier score',
};
const better = (b: Pick<Benchmark, 'better'>) => (b.better === 'lower' ? 'lower is better' : 'higher is better');

/** "AgentHarm, by Gray Swan AI and UK AI Security Institute, 2024. 110 malicious agent tasks… Scores are percentages, and lower is better." */
export function benchDeck(b: Benchmark): string {
  const year = b.released?.slice(0, 4);
  const who = [b.org ? `by ${and(b.org)}` : '', year ?? ''].filter(Boolean).join(', ');
  const head = `${b.name}${who ? `, ${who}` : ''}.`;
  return [head, shortDescription(b.description), `${UNIT_WORDS[b.unit ?? '%'] ?? 'Scores are on the benchmark’s own scale'}, and ${better(b)}.`].filter(Boolean).join(' ');
}

/** The value axis's title: "Score (%), lower is better". */
export const benchAxis = (b: Benchmark) => `${UNIT_AXIS[b.unit ?? '%'] ?? 'Score'}, ${better(b)}`;

export const ECI_DECK =
  'Epoch AI’s Capabilities Index puts models on one scale across many benchmarks, fit from each model’s capability and each benchmark’s difficulty. Higher means more capable.';
export const ECI_AXIS = 'Epoch Capabilities Index, higher is more capable';
export const SRI_DECK =
  'Our Self-Reported Index puts models on the Capabilities Index’s scale using only the scores their labs published, so new releases show up before independent runs arrive. Labs pick what to report, so treat it as a claim.';
export const RELEASE_AXIS = 'Model release date';

/** What a pooled number-one chart counts and leaves out, by the score-source choice on the leader pages. */
export const POOL_NOTES: Record<string, { counts: string; leaves: string }> = {
  headline: {
    counts: 'One source per benchmark: its official leaderboard when that’s current, otherwise Epoch AI’s runs, otherwise labs’ own numbers. Independent runs are dated by model release, lab numbers by when they were published.',
    leaves: 'Every other source, and benchmarks with too few scores to rank.',
  },
  independent: {
    counts: 'Independent runs only: official leaderboards, Epoch AI’s runs and the boards Epoch AI copied, dated by model release.',
    leaves: 'Labs’ own numbers, so benchmarks only labs report drop out.',
  },
  all: {
    counts: 'Every score, including labs’ own numbers and claims Epoch AI collected from reports and papers. Labs pick their own settings, so a claim can beat an independent run.',
    leaves: 'Benchmarks with too few scores to rank.',
  },
};

/** Time-at-number-one shares: the clock rules from the leaders page. */
export const CLOCK_NOTE =
  'Contested time only. A leader’s clock runs for 45 days after it takes the top spot and 45 more after each score from another lab. It stops once the best score passes 85%, or at the last score once 45 days pass without another.';
