// An importer for one benchmark's official leaderboard: the board its makers publish.
// Each file in scripts/leaderboards/ (except this one) default-exports a Leaderboard.

export interface LeaderboardRow {
  /** The model as the board names it. The sync script maps it to data/models.json. */
  model: string;
  /**
   * The board's headline score on the whole benchmark, in the benchmark's unit (percentages as 0 to 100). Never
   * a score on one task, language, split, context length or metric: the site keeps each model's best row
   * (bestPerModel in src/lib/data.ts), so a sub-task row would become the model's score. Sub-scores go in
   * `metrics`.
   */
  score: number;
  /**
   * A way of running the whole benchmark, when the board names one: reasoning effort, tools, a step or time
   * limit, shot count, a prompt or attack mode applied to the whole set.
   */
  setting?: string;
  /** Agent, scaffold or harness, when the board names one. */
  harness?: string;
  /** When the board says the run was made or submitted (YYYY-MM-DD). */
  date?: string;
  /**
   * Average cost of one task in US dollars, as the board computes it. Boards price runs differently, so
   * costs compare within one board only.
   */
  cost?: number;
  /** Average output tokens for one task, when the board reports it. */
  tokens?: number;
  /**
   * Other numbers the board reports for the run, by a short key: "latency" in seconds, "pass3" as a percentage.
   * A board's `chart` names the ones it plots.
   */
  metrics?: Record<string, number>;
}
/** One axis of a board's own chart: the headline score ("score") or a key in each row's `metrics`. */
export interface ChartAxis {
  key: string;
  label: string;
  /** "%", "s" (seconds), "$" or a word. */
  unit?: string;
  better?: 'higher' | 'lower';
  log?: boolean;
}
/**
 * A chart the board draws that a single score cannot show, such as score against latency with its Pareto
 * frontier. The benchmark page redraws it from the rows' metrics, credited to the board.
 */
export interface BoardChart {
  /** The board's own title for the chart. */
  title: string;
  x: ChartAxis;
  y: ChartAxis;
  /** One sentence on what the chart shows, in the board's terms. */
  note?: string;
}

export interface Leaderboard {
  /** Benchmark id in data/benchmarks.json. */
  benchmark: string;
  /** The page people read. */
  url: string;
  /** The machine-readable file or endpoint the importer reads. */
  feed: string;
  /** One sentence on the terms that apply to reading the feed. */
  terms: string;
  /**
   * Who runs the board, when it is not the benchmark's makers: 'Vals AI' for Vals AI's MATH-500 board. Pages then
   * name it, as "Vals AI's leaderboard", instead of calling it the benchmark's own leaderboard.
   */
  host?: string;
  /** Names on this board that the shared resolver cannot place: board name -> model id. */
  aliases?: Record<string, string>;
  /** A chart the board draws from more than its headline score. */
  chart?: BoardChart;
  /**
   * What a row's `cost` covers: one task (the default) or the whole run of the test set, as ARC-AGI-3 reports.
   * Pages label the cost axis to match.
   */
  costPer?: 'task' | 'run';
  fetch(): Promise<LeaderboardRow[]>;
}
