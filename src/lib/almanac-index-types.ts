// The Almanac Index page's payload: every version's boards, cut to what the page shows, plus the changelog between
// each version and the one before it. src/lib/almanac-index-data.ts builds it, /index/ renders it, and
// /index/data.json serves it to the page script.

/** A model's value in one domain of the headline: [value 0 to 100, 1 if from its own scores or 0 if filled]. */
export type Part = [number, 0 | 1];

export interface HeadRow {
  m: string;
  rank: number;
  v: number;
  /** The share of 200 nearby weightings where the model comes first. */
  first: number;
  /** Domains where it has enough scores to rank. */
  doms: number;
  /** The share of the domain weight those domains hold. */
  share: number;
  parts: Record<string, Part>;
}

export interface ProvisionalRow {
  m: string;
  v: number;
  doms: number;
  share: number;
  parts: Record<string, Part>;
}

export interface DomainTest {
  id: string;
  name: string;
  /** Its share of the domain board's weight. */
  weight: number;
  relevance: number;
  launchLabs: number;
  cardLabs: number;
  labs: number;
  releases: number;
  independent: number;
  current: number;
  unit: string;
  /** [model id, best score]. */
  best: [string, number];
}

export interface DomainRow {
  m: string;
  rank: number;
  v: number;
  first: number;
  /** Board tests the model has real scores on. */
  ref: number;
  /** Tests in the domain's pool the model has scores on. */
  n: number;
  /** How much of its domain value comes from domain scores rather than its overall level, 0 to 1. */
  ev: number;
  /** Per board test, its 0 to 100 score or null. */
  parts: (number | null)[];
  /** Per board test, the predicted score where it has none. */
  pred: (number | null)[];
}

export interface Domain {
  id: string;
  name: string;
  group: string;
  /** Tests in the domain that can count. */
  pool: number;
  /** Its share of the headline weight (0 when it has fewer than three board tests). */
  weight: number;
  /** Fewer than five current models ranked. */
  thin: boolean;
  ranked: number;
  tests: DomainTest[];
  rows: DomainRow[];
}

export interface Place {
  rank: number;
  of: number;
  v: number;
  gap: number;
  ev: number;
  n: number;
}

export interface RankingRow {
  id: string;
  name: string;
  relevance: number;
  launchLabs: number;
  cardLabs: number;
  releases: number;
  independent: number;
  current: number;
  versions: number;
  domains: string[];
  signal: Record<string, number>;
}

export interface Version {
  version: string;
  /** The last day of data the version's tests and weights use. */
  cutoff: string;
  /** Not frozen yet: the tests and weights can still change until the 1st. */
  preview: boolean;
  /** The day the sync froze it, or null for a version rebuilt after the fact or not frozen yet. */
  frozen?: string | null;
  /** Rebuilt after the fact from today's data, not saved on the day it froze. */
  rebuilt?: boolean;
  pool: number;
  dropped: Record<string, number>;
  settings: {
    current: string;
    minModels: number;
    saturated: number;
    perDomain: number;
    signals: Record<string, number>;
    fitModels: number;
    domainShare: number;
    draws: number;
  };
  headline: { rows: HeadRow[]; provisional: ProvisionalRow[]; weights: Record<string, number> };
  domains: Domain[];
  /** Models shown in the strengths view: the top of the index and every domain leader. */
  profile: string[];
  place: Record<string, Record<string, Place>>;
  ranking: RankingRow[];
}

export interface Change {
  name: string;
  why: string;
}

export interface DomainChange {
  id: string;
  name: string;
  in: Change[];
  out: Change[];
  /** [leader before, leader after], both on today's scores. */
  leader: [string | null, string | null];
  weight: [number, number];
}

export interface Changelog {
  from: string;
  to: string;
  domains: DomainChange[];
  /** [top five before, top five after]. */
  top: [string[], string[]];
  pool: [number, number];
}

export interface IndexPage {
  /** The version in force today. */
  main: string;
  asOf: string;
  /** Oldest first. */
  order: string[];
  versions: Record<string, Version>;
  /** Keyed by the newer version. */
  changes: Record<string, Changelog>;
  /** id: [name, lab id, lab name, released]. */
  models: Record<string, [string, string, string, string]>;
}
