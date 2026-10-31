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
  /** Model group name in Epoch AI's data. */
  epoch?: string;
}

export interface Links {
  repo?: string;
  dataset?: string;
  leaderboard?: string;
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
  unit?: string;
  better?: 'higher' | 'lower';
  confidence?: Confidence;
  /** Epoch Difficulty Index: on the same scale as the Epoch Capabilities Index. */
  edi?: number;
  epoch?: { epoch_name: string; random?: number; ceiling?: number; runs?: 'epoch' | 'external'; in_eci?: boolean };
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
}

export interface Card {
  id: string;
  lab: string;
  model: string;
  date: string;
  title?: string;
  url?: string;
  tier: Tier;
  notes?: string | null;
  results: CardResult[];
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
  /** Who measured it: the benchmark's own leaderboard, Epoch AI, or the lab in its model card. */
  source: 'leaderboard' | 'epoch' | 'card';
  card?: string;
}
