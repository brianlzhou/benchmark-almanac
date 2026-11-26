// Kaggle Benchmarks' runs of a test that another board also ranks. For a fully open test (public questions and an
// open grader), the user chose on 2026-11-26 to read Kaggle's runs beside the official board, with each row's source
// shown on hover. Kaggle runs every model itself in its own harness, so these are reruns of the same test, not copies
// of the board's rows. A model on both keeps both runs, and pages show its best.
import type { BoardPart, BoardSource, BoardStat, Leaderboard } from '../../leaderboards/types.ts';
import { kaggleFeed, kaggleRows, KAGGLE_TERMS, type KaggleMetric } from '../../leaderboards/kaggle-game-arena.ts';

export const kaggleSource = (owner: string, slug: string): BoardSource => ({
  name: 'Kaggle Benchmarks',
  url: `https://www.kaggle.com/benchmarks/${owner}/${slug}`,
  feed: kaggleFeed(owner, slug),
  terms: KAGGLE_TERMS,
});

export interface KaggleRuns {
  owner: string;
  slug: string;
  /** The Kaggle task that holds the headline score, on the same measure as the board's. */
  task: string;
  /** 100 when Kaggle's values are fractions and the board's are percentages. */
  scale: number;
  /** Other Kaggle tasks kept as metrics, by metrics key: the board's own part and stat keys where they match. */
  extra?: Record<string, KaggleMetric>;
  /** Parts and stats only Kaggle's runs score, added to the board's own. */
  parts?: Record<string, string | BoardPart>;
  stats?: Record<string, BoardStat>;
}

/** The board with Kaggle's runs added. Either source failing fails the read, so the sync keeps the last rows of both. */
export function withKaggle(board: Leaderboard, k: KaggleRuns): Leaderboard {
  const own = board.fetch.bind(board);
  return {
    ...board,
    ...(board.parts || k.parts ? { parts: { ...board.parts, ...k.parts } } : {}),
    ...(board.stats || k.stats ? { stats: { ...board.stats, ...k.stats } } : {}),
    sources: { ...board.sources, kaggle: kaggleSource(k.owner, k.slug) },
    async fetch() {
      const [mine, theirs] = await Promise.all([own(), kaggleRows(k.owner, k.slug, k.task, k.scale, k.extra ?? {})]);
      if (!theirs.length) throw new Error(`Kaggle board ${k.owner}/${k.slug} has no rows on task ${k.task}`);
      return [...mine, ...theirs.map((r) => ({ ...r, source: 'kaggle' }))];
    },
  };
}
