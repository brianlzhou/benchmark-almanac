// Checks data/ before a build or a merge: every reference resolves, ids are unique, fields hold allowed
// values, and short texts follow the house style. Exits 1 on any error.
//
// usage: node scripts/check-data.ts
import { existsSync } from 'node:fs';
import { dataPath, readJson } from './lib/util.ts';

type Rec = Record<string, unknown> & { id: string; name: string };
const labs = readJson<Rec[]>(dataPath('labs.json'));
const models = readJson<Rec[]>(dataPath('models.json'));
const benchmarks = readJson<Rec[]>(dataPath('benchmarks.json'));
const cards = readJson<(Rec & { lab: string; model: string; date: string; results: { benchmark: string }[] })[]>(dataPath('cards.json'));
const systemCards = readJson<{ id: string; lab: string; model: string; date: string; doc: string; release?: string | null; results: { benchmark: string; section: string }[] }[]>(dataPath('system-cards.json'));
const epoch = readJson<{ rows: [string, string, ...unknown[]][]; eci: { model: string }[] }>(dataPath('scores', 'epoch.json'));
const boards = readJson<{ rows: [string, string, ...unknown[]][] }>(dataPath('scores', 'leaderboards.json'));
const sources = readJson<Rec[]>(dataPath('sources.json'));

const taxonomy = readJson<{ levels: { id: string }[]; scoring: { id: string }[]; formats: { id: string }[]; subcategories: Record<string, { id: string }[]> }>(dataPath('taxonomy.json'));
const LEVELS = new Set(taxonomy.levels.map((l) => l.id));
const SCORING = new Set(taxonomy.scoring.map((l) => l.id));
const FORMATS = new Set(taxonomy.formats.map((l) => l.id));

const errors: string[] = [];
const warn: string[] = [];
const fail = (m: string) => errors.push(m);

const CATEGORIES = new Set(
  'coding agentic-terminal computer-use-browser tool-use math science-reasoning knowledge-qa factuality-hallucination long-context multimodal-vision audio-video instruction-following-chat writing-creative-taste multilingual safety-alignment cyber bio-chem ai-rnd-rsi economic-work domain-legal-finance-medical engineering-design games-long-horizon forecasting robotics-embodied world-models other'.split(
    ' ',
  ),
);
const ACCESS = new Set(['public', 'public+private-holdout', 'private', 'unknown']);
const UNITS = new Set(['%', 'elo', 'rating', 'usd', 'minutes', 'score', 'index', 'brier', 'speedup']);
// the almanac's own prose uses American spelling. Quoted text (titles, names, as_written) keeps its own.
const BRITISH =
  /\b(?:(?:behavio|colo|favo|humo|rigo|neighbo|hono|flavo|endeavo)ur\w*|catalogu\w*|licence[sd]?|grey\w*|judgements?|whilst|amongst|learnt|artefacts?|centred|(?:labe|mode|cance|trave|leve|signa|tota|fue)ll(?:ed|ing)|(?:organ|normal|penal|priorit|general|harmon|optim|recogn|summar|special|util|standard|categor|minim|maxim|emphas|real|character|visual|token|final|initial|serial|local|custom|author|memor|formal|stabil|sanit|critic)is(?:e|es|ed|ing|ation|ations))\b/i;

function unique(kind: string, xs: Rec[]) {
  const seen = new Set<string>();
  for (const x of xs) {
    if (!x.id || !/^[a-z0-9][a-z0-9-]*$/.test(x.id)) fail(`${kind}: bad id "${x.id}"`);
    if (seen.has(x.id)) fail(`${kind}: duplicate id ${x.id}`);
    seen.add(x.id);
    if (!x.name) fail(`${kind} ${x.id}: no name`);
  }
  return seen;
}
const labIds = unique('lab', labs);
const modelIds = unique('model', models);
const benchIds = unique('benchmark', benchmarks);
unique('source', sources);

for (const m of models) if (m.lab && !labIds.has(m.lab as string)) fail(`model ${m.id}: unknown lab ${m.lab}`);
for (const b of benchmarks) {
  if (b.category && !CATEGORIES.has(b.category as string)) fail(`benchmark ${b.id}: unknown category ${b.category}`);
  if (b.access && !ACCESS.has(b.access as string)) fail(`benchmark ${b.id}: unknown access ${b.access}`);
  if (b.unit && !UNITS.has(b.unit as string)) fail(`benchmark ${b.id}: unknown unit ${b.unit}`);
  if (b.successor && !benchIds.has(b.successor as string)) fail(`benchmark ${b.id}: unknown successor ${b.successor}`);
  const rf = b.refreshes as { date?: string; label?: string }[] | undefined;
  if (rf && (!Array.isArray(rf) || rf.some((r, i) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '') || !r.label || (i > 0 && r.date! <= rf[i - 1].date!))))
    fail(`benchmark ${b.id}: refreshes need dated labels in order`);
  if (b.level && !LEVELS.has(b.level as string)) fail(`benchmark ${b.id}: unknown level ${b.level}`);
  if (b.scoring && !SCORING.has(b.scoring as string)) fail(`benchmark ${b.id}: unknown scoring ${b.scoring}`);
  if (b.format && !FORMATS.has(b.format as string)) fail(`benchmark ${b.id}: unknown format ${b.format}`);
  if (b.subcategory && !(taxonomy.subcategories[(b.category as string) ?? 'other'] ?? []).some((s) => s.id === b.subcategory))
    fail(`benchmark ${b.id}: subcategory ${b.subcategory} is not under ${b.category}`);
  if (!b.description) warn.push(`benchmark ${b.id}: no description`);
  for (const f of ['description', 'note'] as const) {
    const t = b[f] as string | undefined;
    if (!t) continue;
    if (/;/.test(t)) fail(`benchmark ${b.id}: ${f} has a semicolon`);
    if (/\s[—–]\s|\s--\s/.test(t)) fail(`benchmark ${b.id}: ${f} uses a dash as punctuation`);
    if (/·/.test(t)) fail(`benchmark ${b.id}: ${f} has a middle dot`);
    const uk = t.match(BRITISH);
    if (uk) fail(`benchmark ${b.id}: ${f} uses British spelling "${uk[0]}"`);
  }
  const links = (b.links ?? {}) as Record<string, string>;
  for (const [k, v] of Object.entries(links)) if (!/^https?:\/\//.test(v)) fail(`benchmark ${b.id}: ${k} link is not a web address: ${v}`);
}
const families = new Map<string, number>();
for (const b of benchmarks) if (b.family) families.set(b.family as string, (families.get(b.family as string) ?? 0) + 1);
for (const [f, n] of families) if (n < 2) fail(`family ${f} has only one benchmark`);
for (const b of benchmarks) if (b.family && !b.released) fail(`benchmark ${b.id}: a family member needs a release date`);
for (const b of benchmarks) if (b.family && !b.version) fail(`benchmark ${b.id}: a family member needs a version label`);

for (const c of cards) {
  if (!labIds.has(c.lab)) fail(`card ${c.id}: unknown lab ${c.lab}`);
  if (!modelIds.has(c.model)) fail(`card ${c.id}: unknown model ${c.model}`);
  if (!/^\d{4}-\d\d-\d\d$/.test(c.date)) fail(`card ${c.id}: bad date ${c.date}`);
  for (const r of c.results) if (!benchIds.has(r.benchmark)) fail(`card ${c.id}: unknown benchmark ${r.benchmark}`);
}
// system cards, model cards and technical reports published with a release
const SECTIONS = new Set(['capabilities', 'safety', 'robustness', 'health', 'hallucination', 'alignment', 'monitorability', 'bio-chem', 'cyber', 'ai-rnd', 'autonomy', 'persuasion', 'bias', 'other']);
const DOCS = new Set(['system card', 'system card addendum', 'model card', 'technical report']);
const cardIds = new Set(cards.map((c) => (c as Rec).id as string));
const docIds = new Set<string>();
for (const d of systemCards) {
  if (docIds.has(d.id)) fail(`system card ${d.id}: duplicate id`);
  docIds.add(d.id);
  if (!labIds.has(d.lab)) fail(`system card ${d.id}: unknown lab ${d.lab}`);
  if (!modelIds.has(d.model)) fail(`system card ${d.id}: unknown model ${d.model}`);
  if (!/^\d{4}-\d\d-\d\d$/.test(d.date)) fail(`system card ${d.id}: bad date ${d.date}`);
  if (d.release && !cardIds.has(d.release)) fail(`system card ${d.id}: unknown launch post ${d.release}`);
  if (!DOCS.has(d.doc)) fail(`system card ${d.id}: unknown document type ${d.doc}`);
  const seen = new Set<string>();
  for (const r of d.results) {
    if (!benchIds.has(r.benchmark)) fail(`system card ${d.id}: unknown benchmark ${r.benchmark}`);
    if (seen.has(r.benchmark)) fail(`system card ${d.id}: two results for ${r.benchmark}`);
    seen.add(r.benchmark);
    if (!SECTIONS.has(r.section)) fail(`system card ${d.id}: unknown section ${r.section}`);
  }
}
for (const r of epoch.rows) {
  if (!benchIds.has(r[0])) fail(`epoch row: unknown benchmark ${r[0]}`);
  if (!modelIds.has(r[1])) fail(`epoch row: unknown model ${r[1]}`);
}
for (const e of epoch.eci) if (!modelIds.has(e.model)) fail(`eci: unknown model ${e.model}`);
for (const r of boards.rows) {
  if (!benchIds.has(r[0])) fail(`leaderboard row: unknown benchmark ${r[0]}`);
  if (!modelIds.has(r[1])) fail(`leaderboard row: unknown model ${r[1]}`);
}

// paper abstracts written by scripts/abstracts.ts: only for known benchmarks, and only under an open license
const abstractsPath = dataPath('abstracts.json');
const abstracts = existsSync(abstractsPath)
  ? readJson<Record<string, { text?: string; title?: string; url?: string; source?: string; ref?: string; license?: string; fetched?: string }>>(abstractsPath)
  : {};
const ABSTRACT_SOURCES = new Set(['arxiv', 'acl', 'crossref', 'openreview']);
for (const [id, a] of Object.entries(abstracts)) {
  if (!benchIds.has(id)) fail(`abstract ${id}: unknown benchmark`);
  if (!a.text?.trim()) fail(`abstract ${id}: no text`);
  if (!a.title?.trim() || !a.ref) fail(`abstract ${id}: no paper title or reference`);
  if (!a.license) fail(`abstract ${id}: no license`);
  else if (!/^(CC0 1\.0|CC BY \d\.\d)$/.test(a.license)) fail(`abstract ${id}: license ${a.license} does not allow reuse`);
  if (!ABSTRACT_SOURCES.has(a.source ?? '')) fail(`abstract ${id}: unknown source ${a.source}`);
  if (!/^https?:\/\//.test(a.url ?? '')) fail(`abstract ${id}: url is not a web address`);
  if (!/^\d{4}-\d\d-\d\d$/.test(a.fetched ?? '')) fail(`abstract ${id}: bad fetch date ${a.fetched}`);
}

if (warn.length) console.log(`${warn.length} warnings, for example:\n  ${warn.slice(0, 5).join('\n  ')}`);
if (errors.length) {
  console.error(`${errors.length} errors:\n  ${errors.slice(0, 50).join('\n  ')}`);
  process.exit(1);
}
console.log(`data/ is consistent: ${labs.length} labs, ${models.length} models, ${benchmarks.length} benchmarks, ${cards.length} launch posts, ${systemCards.length} system cards, ${epoch.rows.length} Epoch scores, ${boards.rows.length} leaderboard scores, ${Object.keys(abstracts).length} paper abstracts.`);
