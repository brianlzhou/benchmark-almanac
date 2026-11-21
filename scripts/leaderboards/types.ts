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
  /**
   * Agent, scaffold or harness, when the board names one. Whether a row in it is the model on its own or an agent
   * system built around the model is the board's call: see `Leaderboard.reference` and `Leaderboard.harnesses`.
   */
  harness?: string;
  /** When the board says the run was made or submitted (YYYY-MM-DD). */
  date?: string;
  /** Who submitted or ran the entry, as the board names them: a team, company or person. */
  submitter?: string;
  /** Who made the agent or harness, as the board names them. */
  agentOrg?: string;
  /** The board's own verified or official mark on this entry. `Leaderboard.verified` says what it means. */
  verified?: boolean;
  /**
   * Every model behind one entry, as the board names them, when it uses more than one: an architect and an
   * editor, a planner and an executor, a router's pool. `model` names the main one. An entry with several models
   * is a blend, and the site never credits its score to one model.
   */
  models?: string[];
  /** A link to this entry's own logs, trajectories, transcripts or results. */
  link?: string;
  /** How many trials, attempts or runs the score averages, when the board says. */
  trials?: number;
  /** The board's uncertainty interval for the score (95% unless the board says otherwise), in the score's unit. */
  low?: number;
  high?: number;
  /** Whether the model's weights are open, as the board marks it. */
  open?: boolean;
  /** The model's license, as the board gives it. */
  license?: string;
  /** The model's size in billions of parameters, as the board gives it. */
  params?: number;
  /**
   * Average cost of one task in US dollars, as the board computes it. Boards price runs differently, so
   * costs compare within one board only.
   */
  cost?: number;
  /** Average output tokens for one task, when the board reports it. */
  tokens?: number;
  /**
   * Other numbers the board reports for the run, by a short key: "latency" in seconds, "pass3" as a percentage.
   * A board's `chart` names the ones it plots, and its `parts` names the ones that score a part of the benchmark.
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
  /**
   * One sentence on how the headline score is made, when the source gives no overall score and the importer
   * computes one (the plain mean of the parts, or one part standing in for the whole). Shows on the benchmark page.
   */
  headline?: string;
  /**
   * 'paper' when the source is a fixed table that gains no models, such as the results table in the benchmark's
   * paper or a chart transcribed from it. A full sync then reads it about once a month instead of every run, and the
   * benchmark page says the scores come from the paper, not a leaderboard.
   */
  static?: 'paper';
  /** Names on this board that the shared resolver cannot place: board name -> model id. */
  aliases?: Record<string, string>;
  /** A chart the board draws from more than its headline score. */
  chart?: BoardChart;
  /**
   * Harness names that are the board's own way of running every model: Terminus 2 on Terminal-Bench, a plain API
   * call on LifeSci Diamond. A row in one of them is the model on its own.
   */
  reference?: string[];
  /**
   * What any other harness name on this board is. 'system' (an agent or product built around the model, such as
   * "Arca + GPT-6 Astra") shows as its own entry and never counts as the model's score. 'model' (the default)
   * treats the harness as a label on the model's own score, as when it only names the board's tool setup.
   */
  harnesses?: 'system' | 'model';
  /** What the board's verified mark means, in a few words: "checked by the SWE-bench team". */
  verified?: string;
  /**
   * What a row's `cost` covers: one task (the default) or the whole run of the test set, as ARC-AGI-3 reports.
   * Pages label the cost axis to match.
   */
  costPer?: 'task' | 'run';
  /**
   * The board's scores on parts of the benchmark, kept in each row's `metrics`: a subject, a language, a difficulty
   * level, a task family, a user group. Keys are metric keys, and each names the part as the board does. A part is
   * scored like the whole test, on a subset of its tasks, in the benchmark's unit (or the part's own `unit`). Costs,
   * timings, intervals, vote counts and other measures of the same run are not parts. The benchmark page ranks
   * models on each part in a switch. An importer whose parts come from the feed can set this inside `fetch()`.
   */
  parts?: Record<string, string | BoardPart>;
  /**
   * The board's other numbers for each run, kept in each row's `metrics`: a behavior rate, a preference, a count,
   * latency. Unlike parts, they measure the same run in another way rather than one slice of the test. Each gets a
   * name, a unit and a direction, so the benchmark page can rank entries by it, show it in the measures table and
   * plot it ("Everything the board measures").
   */
  stats?: Record<string, BoardStat>;
  /**
   * Columns that hold another of the benchmark's measures (Benchmark.measures in data/benchmarks.json): metric key
   * -> measure id, such as { partial: 'score' } for a board whose "Score" column is the partial credit labs quote
   * beside its pass rate. Lab numbers on that measure are then compared with this column, never the headline.
   */
  measures?: Record<string, string>;
  fetch(): Promise<LeaderboardRow[]>;
}
/** One part of a benchmark that a board scores on its own. */
/** One of a board's other numbers (`Leaderboard.stats`). */
export interface BoardStat {
  /** The measure's name, as readers should see it: "Lie rate", "Agent preference". */
  name: string;
  /** One of the catalog's units ('%', 'score', 'elo', 'rating', 'usd', 'minutes', ...), or 'count' or 'tokens'. */
  unit?: string;
  /** Which way is better. Leave it out only when the board itself says neither is. */
  better?: 'higher' | 'lower';
  /** One sentence on what it counts, where the name doesn't say. */
  note?: string;
}

export interface BoardPart {
  /** The part's name, as the board gives it: "Teen users", "Hard", "Python". */
  name: string;
  /** What kind of split it belongs to, when the board has several: "Difficulty", "Language", "User". */
  group?: string;
  /** One sentence on what the part holds, where its name doesn't say. */
  note?: string;
  /** The part's unit, when it isn't the benchmark's. */
  unit?: string;
  /** For a measure where lower is better, when the benchmark's own score is higher-better. */
  better?: 'higher' | 'lower';
}
