// Records as they are stored in data/. One name per thing: a "lab" makes "models", a "card" is the
// document a lab publishes with a model (model card, system card, or launch post), and a "benchmark" is a
// test that cards and Epoch AI report scores on.

export type Weights = 'open' | 'closed';
export type Access = 'public' | 'public+private-holdout' | 'private' | 'unknown';
export type Confidence = 'verified' | 'likely' | 'unverified';
export type Tier = 'flagship' | 'mid' | 'small' | 'open-weights';

export interface Lab {
  id: string;
  name: string;
  country?: string;
  url?: string;
  aliases: string[];
}

export interface Model {
  id: string;
  name: string;
  /** Snapshot label when a lab shipped several versions under one name ("May 2024"). */
  version?: string;
  lab?: string;
  family?: string;
  released?: string;
  weights?: Weights;
  tier?: Tier;
  /** URL of the lab's own card for this model. */
  card?: string;
  aliases?: string[];
  /** A router that picks or combines other models for each request (Copilot Fusion), not one trained model. */
  router?: boolean;
  /** Names that mean this model at one setting, mapped to that setting: "GLM-5.3 Prime" is GLM-5.3 served fast. */
  settingAliases?: Record<string, string>;
  /** Model group name in Epoch AI's data. */
  epoch?: string;
}

export interface Links {
  repo?: string;
  dataset?: string;
  leaderboard?: string;
  /** The benchmark's board on Kaggle Benchmarks, when Kaggle runs it beside the board in `leaderboard`. */
  kaggle?: string;
  paper?: string;
  site?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  aliases?: string[];
  category?: string;
  /** A finer category from data/taxonomy.json. */
  subcategory?: string;
  /** Who could solve the tasks: everyday, school, university, competition, expert or frontier. */
  level?: string | null;
  /** How a score is decided: verified, model-judged, expert-graded, preference, head-to-head or outcome. */
  scoring?: string;
  /** What the model produces: multiple-choice, short-answer, proof, code, agent-task, open-ended or prediction. */
  format?: string;
  /** Versions of one test share a family (Terminal-Bench 1.0 to 4.0). A new version retires the one before. */
  family?: string;
  /** The version label within the family ("2.0", "v1.2", "2026"). */
  version?: string;
  description?: string;
  org?: string;
  released?: string;
  links?: Links;
  access?: Access;
  note?: string;
  successor?: string;
  /** The day this record joined the almanac (YYYY-MM-DD), for records added since 2026-11-01. */
  added?: string;
  /** Dated releases that replaced questions but kept the benchmark one record (LiveBench). Charts draw a line at each. */
  refreshes?: { date: string; label: string }[];
  /**
   * Dated changes by the maintainers that change what a score means: a regrade, a new grader, removed or fixed
   * tasks, a new official harness, a new headline metric, corrected questions, or new leaderboard rules. The date
   * is a day (YYYY-MM-DD) or a month (YYYY-MM).
   */
  changes?: BenchmarkChange[];
  unit?: string;
  better?: 'higher' | 'lower';
  /** What the headline score measures, when the name alone doesn't say: "Pass rate", "Mean reward". */
  metric?: string;
  /**
   * Other scores on this benchmark that labs or boards report beside the headline: another way to score the whole
   * test (a partial-credit score, pass@3) or the headline's measure on one part of it (128K context). A lab result
   * that quotes one names it (CardResult.measure), and is compared only with the same measure, never the headline.
   */
  measures?: Measure[];
  confidence?: Confidence;
  /** Epoch Difficulty Index: on the same scale as the Epoch Capabilities Index. */
  edi?: number;
  epoch?: { epoch_name: string; random?: number; ceiling?: number; runs?: 'epoch' | 'external'; in_eci?: boolean };
}

export type ChangeKind = 'regrade' | 'grader' | 'subset' | 'harness' | 'scoring' | 'questions' | 'policy';

/** A score on a benchmark other than its headline (Benchmark.measures). */
export interface Measure {
  /** A short id, unique within the benchmark: "score", "pass-3", "128k". */
  id: string;
  /** As the lab or board names it: "Score", "Pass@3", "128K context". */
  name: string;
  /** "metric" scores the whole test another way. "part" is the headline's measure on one part of the test. */
  kind: 'metric' | 'part';
  /** One sentence on what it counts, where the name doesn't say. */
  note?: string;
  /** Its unit and direction, when they differ from the benchmark's. */
  unit?: string;
  better?: 'higher' | 'lower';
}

export interface BenchmarkChange {
  date: string;
  kind: ChangeKind;
  text: string;
  url: string;
}

export interface Resource {
  id: string;
  name: string;
  kind: string;
  category?: string;
  description?: string;
  org?: string;
  released?: string;
  links?: Links;
  note?: string;
}

export interface CardResult {
  benchmark: string;
  score: number | null;
  unit: string | null;
  as_written?: string;
  /** System cards: where in the document the result sits (capabilities, safety, bio-chem, cyber...). */
  section?: string;
  /**
   * When the number is not the benchmark's headline score but another of its measures (Benchmark.measures), the
   * measure's id. Such a result stays out of the headline charts and ranks, and is compared only with the same
   * measure on the board.
   */
  measure?: string;
}

export interface Card {
  id: string;
  lab: string;
  model: string;
  date: string;
  title?: string;
  url?: string;
  tier?: Tier;
  notes?: string | null;
  results: CardResult[];
  /** A launch post (data/cards.json) or a longer document published with the release (data/system-cards.json). */
  kind?: 'launch' | 'system-card';
  /** System cards: "system card", "system card addendum", "model card" or "technical report". */
  doc?: string;
  /** System cards: the id of the launch post this document goes with. */
  release?: string;
}

/** One score of one model on one benchmark, from either source. */
export interface Score {
  benchmark: string;
  model: string;
  value: number;
  unit: string;
  setting?: string | null;
  harness?: string | null;
  date?: string | null;
  /** Average US dollars per task, as the leaderboard prices it. Compare within one benchmark only. */
  cost?: number | null;
  /** Average output tokens per task, when the leaderboard reports it. */
  tokens?: number | null;
  /** Other numbers the leaderboard reports for the run, such as latency in seconds ("latency") or pass^3 ("pass3"). */
  metrics?: Record<string, number>;
  /**
   * Who measured it: the benchmark's own leaderboard, Epoch AI's own run, the lab in its model card, or a score
   * Epoch AI collected from somewhere else ('collected', with `via` and `from`).
   */
  source: 'leaderboard' | 'epoch' | 'card' | 'collected';
  /**
   * For a collected score, where Epoch AI got it: another leaderboard ('board', which counts as an independent
   * run), a lab's own report ('lab'), a research paper ('paper'), or a source Epoch doesn't name ('unknown').
   * Only 'board' counts as independent. The rest are claims.
   */
  via?: 'board' | 'lab' | 'paper' | 'unknown';
  /** For a collected score, the source Epoch AI names: a title or a link. */
  from?: string | null;
  card?: string;
  /** For a score on another of the benchmark's measures than its headline: the measure's id (Benchmark.measures). */
  measure?: string;
  /**
   * The leaderboard's own name for an entry that is not in data/models.json (a fine-tune, agent system, product
   * or older model). Such a score has an empty `model`, shows on its benchmark's board, and never counts toward
   * leaders or lab credit.
   */
  name?: string;
  /** Facts the leaderboard gives about the entry beyond its score (scripts/sync-leaderboards.ts). */
  info?: ScoreInfo;
  /**
   * For an entry that is an agent or product built around the model ("Arca + GPT-6 Astra"), or that uses several
   * models, the agent's name. Such a score shows on its board under that name and never counts as the model's.
   */
  system?: string;
}

/** What a leaderboard says about one entry beyond its score. Every field is optional. */
export interface ScoreInfo {
  /** Who submitted or ran the entry. */
  submitter?: string;
  /** Who made the agent or harness. */
  agentOrg?: string;
  /** The board's own verified or official mark. */
  verified?: boolean;
  /** Every model behind a blend: model ids, or "~" and the board's name for one we don't track. */
  models?: string[];
  /** The board's own date for the run, when `date` holds the model's release. */
  run?: string;
  /** The entry's own logs, trajectories or results. */
  link?: string;
  /** How many trials the score averages. */
  trials?: number;
  /** The board's uncertainty interval, in the score's unit. */
  low?: number;
  high?: number;
  /** The model's weights, license and size (billions of parameters), as the board gives them. */
  open?: boolean;
  license?: string;
  params?: number;
  /**
   * The key of the other source the run came from, on a board that adds one (Board.sources): "kaggle" for Kaggle's
   * reruns beside an open test's official board. Absent for the board's own rows.
   */
  source?: string;
}

/** A harness or agent in data/harnesses.json. */
export interface Harness {
  id: string;
  name: string;
  aliases: string[];
  /** A lab id when a lab makes it, otherwise the maker's name. */
  maker: string;
  /** 'reference': a neutral harness, so a run in it is the model on its own. 'agent': an agent or product. */
  kind: 'reference' | 'agent';
  url?: string;
}

/** The abstract of a benchmark's own paper, in its authors' words (data/abstracts.json, from scripts/abstracts.ts). */
export interface PaperAbstract {
  text: string;
  /** The paper's title as its host gives it. */
  title: string;
  url: string;
  source: 'arxiv' | 'acl' | 'crossref' | 'openreview';
  /** How the page names the paper: "arXiv:2406.19314", "ACL 2024.emnlp-main.499", "doi:10.1038/sdata.2018.251". */
  ref: string;
  /** "CC0 1.0" or "CC BY 4.0": only licenses that allow reuse with credit. */
  license: string;
  /** The day the abstract was read (YYYY-MM-DD). */
  fetched: string;
}
