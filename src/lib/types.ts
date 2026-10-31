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
  source: 'epoch' | 'card';
  card?: string;
}
