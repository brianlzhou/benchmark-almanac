// The facets that describe each benchmark: the codebook (data/facets-codebook.json) and each benchmark's values
// (data/facets.json). Every facet answers one question about one part of an evaluation, with values from a widely
// used standard where one exists. Pages read them through this file: names for values, the row attributes the
// filter script matches, the words the search box matches, and the saved views (data/views.json).
import codebook from '../../data/facets-codebook.json';
import facetsJson from '../../data/facets.json';
import viewsJson from '../../data/views.json';

export type FacetKey = 'construct' | 'risk' | 'propensity' | 'subject' | 'language' | 'input' | 'output' | 'interaction' | 'environment' | 'source' | 'refresh' | 'runner' | 'basis';
export interface BenchFacets {
  construct?: string;
  risk?: string[];
  propensity?: string[];
  subject?: string[];
  language?: string[];
  input?: string[];
  output?: string[];
  interaction?: string;
  environment?: string[];
  source?: string[];
  refresh?: string;
  runner?: string;
  /** original, version (of another benchmark) or method (another party's method on new tests). */
  basis?: string;
  /** The benchmarks a version or method run is based on. */
  basedOn?: string[];
  /** Facts, filled only when the benchmark states them. */
  occupations?: string[];
  humanTime?: string | null;
  /** A composite index: its score is an average of other benchmarks' scores or a fit across them. */
  combines?: 'average' | 'fit';
  /** The benchmarks a composite combines, where its record names them. */
  components?: string[];
}
export interface FacetValue {
  id: string;
  name: string;
  note?: string;
}
export interface Facet {
  key: FacetKey;
  name: string;
  question: string;
  several: boolean;
  part: string;
  standard: string;
  values?: FacetValue[];
  codes?: string;
  named?: string[];
}

export const FACETS = codebook.facets as Facet[];
export const FACTS = codebook.facts as { key: 'occupations' | 'humanTime' | 'combines'; name: string; question: string; standard: string; values: FacetValue[] }[];
export const PARTS = codebook.parts as { id: string; name: string }[];
const BY_KEY = new Map(FACETS.map((f) => [f.key, f]));
const VALUE = new Map(FACETS.flatMap((f) => (f.values ?? []).map((v) => [`${f.key}:${v.id}`, v] as const)));
const FACT_VALUE = new Map(FACTS.flatMap((f) => f.values.map((v) => [`${f.key}:${v.id}`, v] as const)));

const TAGGED = (facetsJson as { benchmarks: Record<string, BenchFacets> }).benchmarks;
/** A benchmark's facet values, or undefined while it is not tagged yet. */
export const facetsOf = (id: string): BenchFacets | undefined => TAGGED[id];
export const taggedCount = Object.keys(TAGGED).length;
/** Agreement between Codex and a blind second tagger on a random sample, per facet (Krippendorff's alpha). */
export const AGREEMENT = (facetsJson as { agreement?: { n: number; facets: Record<string, { alpha: number; exact: number; n: number }> } }).agreement;
/**
 * Whether readers see a facet: its agreement in the blind check reached 0.667 (the usual floor for tentative use),
 * or the check had too few benchmarks to judge it. A facet below that stays in the data but out of filters and pages.
 */
export const isShownFacet = (key: string) => {
  const a = AGREEMENT?.facets[key];
  return !a || a.n < 20 || a.alpha >= 0.667;
};

// the six areas of the OECD fields, for the subject filter's top level
export const SUBJECT_AREAS: Record<string, string> = {
  '1': 'Natural sciences',
  '2': 'Engineering and technology',
  '3': 'Medical and health sciences',
  '4': 'Agricultural and veterinary sciences',
  '5': 'Social sciences',
  '6': 'Humanities and the arts',
};

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
export function languageName(code: string): string {
  if (code === 'mul') return 'Many languages';
  if (code === 'unknown') return 'Not stated';
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The kind of an environment value ("application:Blender" is an application) and its name, if it has one. */
export const envType = (v: string) => v.split(':')[0];
export const envName = (v: string) => (v.includes(':') ? v.slice(v.indexOf(':') + 1).trim() : undefined);

/** A value's name as readers see it: "Biological sciences", "Korean", "Blender". */
export function valueName(key: FacetKey, v: string): string {
  if (key === 'language') return languageName(v);
  if (key === 'environment') return envName(v) ?? VALUE.get(`environment:${v}`)?.name ?? v;
  return VALUE.get(`${key}:${v}`)?.name ?? v;
}
export const valueNote = (key: FacetKey, v: string) => VALUE.get(`${key}:${envType(v)}`)?.note;
export const factName = (key: 'occupations' | 'humanTime' | 'combines', v: string) => FACT_VALUE.get(`${key}:${v}`)?.name ?? v;
/** Whether a benchmark is a composite index: its score combines other benchmarks' scores. */
export const isComposite = (id: string) => !!facetsOf(id)?.combines;
export const facet = (key: FacetKey) => BY_KEY.get(key)!;

const list = (f: BenchFacets, key: FacetKey): string[] => {
  const v = f[key];
  return v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];
};
/** A facet's values on a benchmark, leaving out "none" and "unknown". */
export const shown = (f: BenchFacets | undefined, key: FacetKey) => (f ? list(f, key).filter((v) => v !== 'none' && v !== 'unknown') : []);

// The row attribute each facet filters on. Environment matches by kind (a named app is "application"), and subject
// also by area, so choosing "Medical and health sciences" finds every 3.x field.
export const FILTER_KEYS: Record<FacetKey, string> = {
  construct: 'fconstruct',
  risk: 'frisk',
  propensity: 'fbehavior',
  subject: 'fsubject',
  language: 'flang',
  input: 'finput',
  output: 'foutput',
  interaction: 'finteraction',
  environment: 'fenv',
  source: 'fsource',
  refresh: 'frefresh',
  runner: 'frunner',
  basis: 'fbasis',
};
function tokens(f: BenchFacets, key: FacetKey): string[] {
  const vs = list(f, key);
  if (key === 'environment') return [...new Set(vs.map(envType))];
  if (key === 'subject') return [...new Set(vs.flatMap((v) => (v === 'none' ? [v] : [v.split('.')[0], v])))];
  return vs;
}
/** The data attributes the filter script matches, for a benchmark's table row. */
export function facetAttrs(id: string): Record<string, string> {
  const f = facetsOf(id);
  if (!f) return {};
  const out: Record<string, string> = {};
  for (const fc of FACETS.filter((x) => isShownFacet(x.key))) {
    const t = tokens(f, fc.key);
    if (t.length) out[`data-${FILTER_KEYS[fc.key]}`] = t.join(' ');
  }
  return out;
}
/** Words the search box should match: named apps and games, languages, subjects, risks and behaviors. */
export function facetWords(id: string): string {
  const f = facetsOf(id);
  if (!f) return '';
  const names = [
    ...shown(f, 'environment').flatMap((v) => envName(v) ?? []),
    ...shown(f, 'language').filter((v) => v !== 'en' && v !== 'mul').map(languageName),
    ...shown(f, 'subject').map((v) => valueName('subject', v)),
    ...shown(f, 'risk').map((v) => valueName('risk', v)),
    ...shown(f, 'propensity').map((v) => valueName('propensity', v)),
  ];
  return [...new Set(names)].join(' ');
}

/** Filter options for one facet, with counts over the given benchmarks (each weighted, as a family row counts its versions). */
export function facetOptions(key: FacetKey, items: { id: string; n?: number }[]): { value: string; label: string; depth?: number; count?: number }[] {
  const fc = facet(key);
  const count = new Map<string, number>();
  for (const it of items) {
    const f = facetsOf(it.id);
    if (!f) continue;
    for (const t of tokens(f, key)) count.set(t, (count.get(t) ?? 0) + (it.n ?? 1));
  }
  const all = { value: '', label: `Any ${fc.name.toLowerCase()}` };
  if (key === 'subject') {
    const out: { value: string; label: string; depth?: number; count?: number }[] = [all];
    for (const [a, name] of Object.entries(SUBJECT_AREAS)) {
      if (!count.get(a)) continue;
      out.push({ value: a, label: name, depth: 0, count: count.get(a) });
      for (const v of fc.values ?? []) if (v.id.split('.')[0] === a && count.get(v.id)) out.push({ value: v.id, label: v.name, depth: 1, count: count.get(v.id) });
    }
    if (count.get('none')) out.push({ value: 'none', label: 'No specialist field', depth: 0, count: count.get('none') });
    return out;
  }
  if (key === 'language') {
    return [all, ...[...count.entries()].sort((a, b) => b[1] - a[1] || languageName(a[0]).localeCompare(languageName(b[0]))).map(([v, n]) => ({ value: v, label: languageName(v), count: n }))];
  }
  return [all, ...(fc.values ?? []).filter((v) => count.get(v.id)).map((v) => ({ value: v.id, label: v.name, count: count.get(v.id) }))];
}

// ---- saved views ---------------------------------------------------------------------------------------------
// A view is a named filter over facets, written as a rule: {"all": [...]}, {"any": [...]}, or a clause
// {"facet": "environment", "in": ["desktop"]} that holds when the benchmark has one of those values. Environment
// clauses match by kind ("application") or by full value ("application:Blender"), and subject clauses by area too.
type Rule = { all: Rule[] } | { any: Rule[] } | { facet: FacetKey; in: string[] };
export interface View {
  id: string;
  name: string;
  note: string;
  rule: Rule;
}
export const VIEWS = (viewsJson as { views: View[] }).views;
export const viewById = (id: string) => VIEWS.find((v) => v.id === id);

function holds(rule: Rule, f: BenchFacets): boolean {
  if ('all' in rule) return rule.all.every((r) => holds(r, f));
  if ('any' in rule) return rule.any.some((r) => holds(r, f));
  const vs = list(f, rule.facet);
  const want = new Set(rule.in.map((x) => x.toLowerCase()));
  return vs.some((v) => {
    const l = v.toLowerCase();
    if (want.has(l)) return true;
    if (rule.facet === 'environment') return want.has(envType(l));
    if (rule.facet === 'subject') return want.has(l.split('.')[0]);
    return false;
  });
}
/** Whether a benchmark belongs in a view. An untagged benchmark belongs in none. */
export function inView(view: View, id: string): boolean {
  const f = facetsOf(id);
  return !!f && holds(view.rule, f);
}

/** A rule in words, for the view page: "environment includes desktop apps, browser or phone apps, and input includes screens". */
export function ruleText(rule: Rule): string {
  const or = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs.at(-1)}`);
  if ('all' in rule) return rule.all.map(ruleText).join(', and ');
  if ('any' in rule) return rule.any.map(ruleText).join('. Or ');
  const fc = facet(rule.facet);
  // lowercase inside a sentence, but keep acronyms (CBRN) and app or game names as they are written
  const names = rule.in.map((v) => {
    const n = rule.facet === 'subject' && SUBJECT_AREAS[v] ? SUBJECT_AREAS[v] : valueName(rule.facet, v);
    return /^[A-Z0-9]{2,}$/.test(n) || envName(v) ? n : n.toLowerCase();
  });
  if (rule.facet === 'construct') return `it measures ${or(names)}`;
  if (rule.facet === 'runner') return `it is run by ${or(names)}`;
  if (rule.facet === 'basis') return `it is ${or(names)}`;
  return `${fc.name.toLowerCase()} ${fc.several ? 'includes' : 'is'} ${or(names)}`;
}
