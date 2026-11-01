// An importer for one benchmark's official leaderboard: the board its makers publish.
// Each file in scripts/leaderboards/ (except this one) default-exports a Leaderboard.

export interface LeaderboardRow {
  /** The model as the board names it. The sync script maps it to data/models.json. */
  model: string;
  /** The board's headline score, in the benchmark's unit (percentages as 0 to 100). */
  score: number;
  /** Reasoning effort or other setting, when the board names one. */
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
  /** Names on this board that the shared resolver cannot place: board name -> model id. */
  aliases?: Record<string, string>;
  fetch(): Promise<LeaderboardRow[]>;
}
