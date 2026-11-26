// Checks data/ before a build or a merge: every reference resolves, ids are unique, fields hold allowed
// values, and short texts follow the house style. Exits 1 on any error.
//
// usage: node scripts/check-data.ts
import { existsSync } from 'node:fs';
import { dataPath, readJson, key } from './lib/util.ts';
import { readScores } from './lib/scores.ts';

type Rec = Record<string, unknown> & { id: string; name: string };
const labs = readJson<Rec[]>(dataPath('labs.json'));
const models = readJson<Rec[]>(dataPath('models.json'));
const benchmarks = readJson<Rec[]>(dataPath('benchmarks.json'));
const cards = readJson<(Rec & { lab: string; model: string; date: string; results: { benchmark: string }[] })[]>(dataPath('cards.json'));
const systemCards = readJson<{ id: string; lab: string; model: string; date: string; doc: string; release?: string | null; results: { benchmark: string; section: string }[] }[]>(dataPath('system-cards.json'));
const epoch = readJson<{ rows: [string, string, ...unknown[]][]; eci: { model: string }[] }>(dataPath('scores', 'epoch.json'));
const boards = readScores();
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
const CHANGE_KINDS = new Set(['regrade', 'grader', 'subset', 'harness', 'scoring', 'questions', 'policy']);
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
// a board alias must point at a model we have, on a board we read
if (existsSync(dataPath('board-aliases.json'))) {
  const ba = readJson<{ boards: Record<string, Record<string, string>> }>(dataPath('board-aliases.json')).boards;
  const modelIds = new Set(models.map((m) => m.id as string));
  for (const [board, map] of Object.entries(ba)) for (const [n, id] of Object.entries(map)) if (!modelIds.has(id)) fail(`board-aliases ${board}: "${n}" points at unknown model ${id}`);
}
// a name with a setting must name a setting, and must not also be a plain name of some model
{
  const plain = new Set(models.flatMap((m) => [m.name, m.id, ...((m.aliases as string[] | undefined) ?? [])].map((n) => key(n as string))));
  for (const m of models)
    for (const [n, v] of Object.entries((m.settingAliases as Record<string, string> | undefined) ?? {})) {
      if (typeof v !== 'string' || !v.trim()) fail(`model ${m.id}: setting alias "${n}" has no setting`);
      if (plain.has(key(n))) fail(`model ${m.id}: setting alias "${n}" is also a plain model name`);
    }
}
for (const b of benchmarks) {
  if (b.category && !CATEGORIES.has(b.category as string)) fail(`benchmark ${b.id}: unknown category ${b.category}`);
  if (b.access && !ACCESS.has(b.access as string)) fail(`benchmark ${b.id}: unknown access ${b.access}`);
  if (b.unit && !UNITS.has(b.unit as string)) fail(`benchmark ${b.id}: unknown unit ${b.unit}`);
  if (b.successor && !benchIds.has(b.successor as string)) fail(`benchmark ${b.id}: unknown successor ${b.successor}`);
  // evidence is a list of links; a single string merged into it once left one character per entry
  if (b.evidence !== undefined && (!Array.isArray(b.evidence) || (b.evidence as unknown[]).some((u) => typeof u !== 'string' || !/^https?:\/\//.test(u)))) fail(`benchmark ${b.id}: evidence must be a list of links`);
  const rf = b.refreshes as { date?: string; label?: string }[] | undefined;
  if (rf && (!Array.isArray(rf) || rf.some((r, i) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '') || !r.label || (i > 0 && r.date! <= rf[i - 1].date!))))
    fail(`benchmark ${b.id}: refreshes need dated labels in order`);
  const ch = b.changes as { date?: string; kind?: string; text?: string; url?: string }[] | undefined;
  if (ch !== undefined) {
    if (!Array.isArray(ch)) fail(`benchmark ${b.id}: changes must be a list`);
    else
      ch.forEach((c, i) => {
        const at = `benchmark ${b.id}: change ${i + 1}`;
        if (!/^\d{4}-\d{2}(-\d{2})?$/.test(c.date ?? '')) fail(`${at} needs a date (YYYY-MM-DD or YYYY-MM)`);
        if (i > 0 && (c.date ?? '') < (ch[i - 1].date ?? '')) fail(`${at} is out of date order`);
        if (!CHANGE_KINDS.has(c.kind ?? '')) fail(`${at} has unknown kind ${c.kind}`);
        if (!c.text) fail(`${at} has no text`);
        if (!/^https?:\/\//.test(c.url ?? '')) fail(`${at} needs a source link`);
        const tx = c.text ?? '';
        if (/;/.test(tx)) fail(`${at} has a semicolon`);
        if (/\s[—–]\s|\s--\s/.test(tx)) fail(`${at} uses a dash as punctuation`);
        const uk = tx.match(BRITISH);
        if (uk) fail(`${at} uses British spelling "${uk[0]}"`);
      });
  }
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

// notes on why a lab claim and a leaderboard differ (data/claim-notes.json)
if (existsSync(dataPath('claim-notes.json'))) {
  const notes = readJson<{ model?: string; benchmark?: string; cause?: string; reason?: string; evidence?: string[] }[]>(dataPath('claim-notes.json'));
  const seenNote = new Set<string>();
  for (const n of notes) {
    const at = `claim note ${n.model}|${n.benchmark}`;
    if (!modelIds.has(n.model ?? '')) fail(`${at}: unknown model`);
    if (!benchIds.has(n.benchmark ?? '')) fail(`${at}: unknown benchmark`);
    if (seenNote.has(`${n.model}|${n.benchmark}`)) fail(`${at}: duplicate`);
    seenNote.add(`${n.model}|${n.benchmark}`);
    if (!['setup', 'metric'].includes(n.cause ?? '')) fail(`${at}: cause must be setup or metric`);
    if (!n.reason || /;/.test(n.reason) || /\s[—–]\s|\s--\s/.test(n.reason)) fail(`${at}: reason missing or off style`);
    const uk = (n.reason ?? '').match(BRITISH);
    if (uk) fail(`${at}: British spelling "${uk[0]}"`);
    if (!Array.isArray(n.evidence) || !n.evidence.length || n.evidence.some((u) => !/^https?:\/\//.test(u))) fail(`${at}: needs evidence links`);
  }
}

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
    // one result per benchmark and measure: a document may give a pass rate and a partial-credit score
    const rk = `${r.benchmark}|${(r as { measure?: string }).measure ?? ''}`;
    if (seen.has(rk)) fail(`system card ${d.id}: two results for ${r.benchmark}${(r as { measure?: string }).measure ? ` (${(r as { measure?: string }).measure})` : ''}`);
    seen.add(rk);
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

// a benchmark's other measures (Benchmark.measures), the lab results that quote one, and the board columns that
// hold one: every reference names a measure the benchmark defines
{
  const measuresOf = new Map<string, Set<string>>();
  for (const b of benchmarks) {
    const ms = (b as { measures?: { id?: string; name?: string; kind?: string; note?: string; unit?: string; better?: string }[] }).measures;
    if (ms === undefined) continue;
    const at = `benchmark ${b.id}: measures`;
    if (!Array.isArray(ms) || !ms.length) { fail(`${at} must be a non-empty list`); continue; }
    const ids = new Set<string>();
    for (const m of ms) {
      if (!m.id || !/^[a-z0-9][a-z0-9-]*$/.test(m.id)) fail(`${at}: bad id ${m.id}`);
      if (ids.has(m.id ?? '')) fail(`${at}: duplicate id ${m.id}`);
      ids.add(m.id ?? '');
      if (!m.name) fail(`${at}: ${m.id} has no name`);
      if (!['metric', 'part'].includes(m.kind ?? '')) fail(`${at}: ${m.id} kind must be metric or part`);
      if (m.better !== undefined && !['higher', 'lower'].includes(m.better)) fail(`${at}: ${m.id} better must be higher or lower`);
      for (const text of [m.name, m.note]) {
        if (!text) continue;
        if (/;/.test(text) || /\s[—–]\s|\s--\s/.test(text)) fail(`${at}: ${m.id} is off style`);
        const uk = text.match(BRITISH);
        if (uk) fail(`${at}: ${m.id} uses British spelling "${uk[0]}"`);
      }
    }
    measuresOf.set(b.id, ids);
  }
  for (const c of [...cards, ...systemCards]) for (const r of c.results as { benchmark: string; measure?: string }[])
    if (r.measure !== undefined && !measuresOf.get(r.benchmark)?.has(r.measure)) fail(`card ${c.id}: ${r.benchmark} has no measure ${r.measure}`);
  const lbm = boards as unknown as { boards: Record<string, { measures?: Record<string, string> }> };
  for (const [id, x] of Object.entries(lbm.boards))
    for (const [key, mid] of Object.entries(x.measures ?? {}))
      if (!measuresOf.get(id)?.has(mid)) fail(`board ${id}: column ${key} names unknown measure ${mid}`);
}

// the parts a board scores on their own (Leaderboard.parts): each names a metric key its rows keep, in site copy style
{
  const PART_UNITS = new Set(['%', 'score', 'elo', 'rating', 'index', 'speedup', 'usd', 'minutes', 'brier']);
  const lbAll = boards as unknown as { boards: Record<string, { parts?: Record<string, { name?: string; group?: string; note?: string; unit?: string; better?: string }> }>; rows: unknown[][]; others?: unknown[][] };
  const scored = new Map<string, Set<string>>();
  for (const r of [...lbAll.rows, ...(lbAll.others ?? [])]) {
    const m = r[8] as Record<string, number> | null | undefined;
    if (!m) continue;
    const s = scored.get(r[0] as string) ?? new Set<string>();
    for (const k of Object.keys(m)) s.add(k);
    scored.set(r[0] as string, s);
  }
  for (const [id, b] of Object.entries(lbAll.boards)) {
    for (const [k, p] of Object.entries(b.parts ?? {})) {
      const at = `board ${id}: part ${k}`;
      if (!scored.get(id)?.has(k)) fail(`${at} is not a metric any row keeps`);
      if (!p.name) fail(`${at} has no name`);
      for (const [field, text] of [['name', p.name], ['group', p.group], ['note', p.note]] as const) {
        if (!text) continue;
        if (/;/.test(text)) fail(`${at}: ${field} has a semicolon`);
        if (/\s[—–]\s|\s--\s/.test(text)) fail(`${at}: ${field} uses a dash as punctuation`);
        // a part's name is the board's own label, often a proper name ("Grey's Anatomy"), so only our prose is checked
        const uk = field === 'name' ? null : text.match(BRITISH);
        if (uk) fail(`${at}: ${field} uses British spelling "${uk[0]}"`);
      }
      if (p.unit !== undefined && !PART_UNITS.has(p.unit)) fail(`${at}: unknown unit ${p.unit}`);
      if (p.better !== undefined && !['higher', 'lower'].includes(p.better)) fail(`${at}: better must be higher or lower`);
    }
  }
}

// a board's other measures (Leaderboard.stats): each names a metric key its rows keep that isn't a part, in site copy style
{
  const STAT_UNITS = new Set(['%', 'score', 'elo', 'rating', 'index', 'speedup', 'usd', 'minutes', 'brier', 'count', 'seconds', 'ms', 'hours', 'tokens', 'tokens/s', 'usd-per-mtok', 'cny', 'thousands', 'millions', 'billions', 'gb']);
  const lbAll = boards as unknown as { boards: Record<string, { parts?: Record<string, unknown>; stats?: Record<string, { name?: string; note?: string; unit?: string; better?: string }> }>; rows: unknown[][]; others?: unknown[][] };
  const scored = new Map<string, Set<string>>();
  for (const r of [...lbAll.rows, ...(lbAll.others ?? [])]) {
    const m = r[8] as Record<string, number> | null | undefined;
    if (!m) continue;
    const s = scored.get(r[0] as string) ?? new Set<string>();
    for (const k of Object.keys(m)) s.add(k);
    scored.set(r[0] as string, s);
  }
  // cost and tokens have their own columns, so a stat may name them without a metric
  const ownColumns = new Set(['cost', 'tokens']);
  for (const [id, b] of Object.entries(lbAll.boards)) {
    for (const [k, st] of Object.entries(b.stats ?? {})) {
      const at = `board ${id}: stat ${k}`;
      if (!ownColumns.has(k) && !scored.get(id)?.has(k)) fail(`${at} is not a metric any row keeps`);
      if (b.parts && k in b.parts) fail(`${at} is also a part`);
      if (!st.name) fail(`${at} has no name`);
      for (const [field, text] of [['name', st.name], ['note', st.note]] as const) {
        if (!text) continue;
        if (/;/.test(text)) fail(`${at}: ${field} has a semicolon`);
        if (/\s[—–]\s|\s--\s/.test(text)) fail(`${at}: ${field} uses a dash as punctuation`);
        const uk = field === 'name' ? null : text.match(BRITISH);
        if (uk) fail(`${at}: ${field} uses British spelling "${uk[0]}"`);
      }
      if (st.unit !== undefined && !STAT_UNITS.has(st.unit)) fail(`${at}: unknown unit ${st.unit}`);
      if (st.better !== undefined && !['higher', 'lower'].includes(st.better)) fail(`${at}: better must be higher or lower`);
    }
  }
}

// the info column (scripts/sync-leaderboards.ts): what a board says about an entry beyond its score
{
  const INFO_KEYS = new Set(['submitter', 'agentOrg', 'verified', 'models', 'run', 'link', 'trials', 'low', 'high', 'open', 'license', 'params', 'source']);
  const all = [...boards.rows, ...((boards as { others?: unknown[][] }).others ?? [])];
  for (const r of all) {
    if (r.length <= 9) continue;
    const at = `leaderboard row ${r[0]} ${r[1]}`;
    if (r[8] !== null && (typeof r[8] !== 'object' || Array.isArray(r[8]))) fail(`${at}: metrics is not an object or null`);
    const i = r[9] as Record<string, unknown>;
    if (!i || typeof i !== 'object' || Array.isArray(i)) {
      fail(`${at}: info is not an object`);
      continue;
    }
    for (const k of Object.keys(i)) if (!INFO_KEYS.has(k)) fail(`${at}: unknown info key ${k}`);
    if (i.models !== undefined && (!Array.isArray(i.models) || i.models.length < 2 || i.models.some((m) => typeof m !== 'string' || (!m.startsWith('~') && !modelIds.has(m)))))
      fail(`${at}: info.models must list two or more known model ids or ~names`);
    if (i.run !== undefined && !/^\d{4}-\d\d-\d\d$/.test(String(i.run))) fail(`${at}: info.run is not a date`);
    // a row from another source names one its board lists (scripts/lib/boards/kaggle.ts)
    if (i.source !== undefined && !(boards.boards as Record<string, { sources?: Record<string, unknown> }>)[String(r[0])]?.sources?.[String(i.source)]) fail(`${at}: info.source ${i.source} is not one of its board's sources`);
    if (i.link !== undefined && !/^https?:\/\/\S+$/.test(String(i.link))) fail(`${at}: info.link is not a web address`);
    if ((i.low === undefined) !== (i.high === undefined) || (typeof i.low === 'number' && typeof i.high === 'number' && i.low > i.high)) fail(`${at}: info.low and info.high must come together, low first`);
    for (const k of ['verified', 'open']) if (i[k] !== undefined && typeof i[k] !== 'boolean') fail(`${at}: info.${k} is not true or false`);
    for (const k of ['trials', 'params']) if (i[k] !== undefined && !(typeof i[k] === 'number' && i[k] > 0)) fail(`${at}: info.${k} is not a positive number`);
  }
  // one name for one measure in metrics: pass@k is passAtK and pass^k is passK (scripts/leaderboards/types.ts)
  const SYNONYM = /^(pass@\d+|pass_at_\d+|standardError|total_tokens|tokensTotal|input_tokens|output_tokens|reasoning_tokens|cached_input_tokens|inputPricePerMillionTokens|outputPricePerMillionTokens|meanSteps)$/;
  const odd = new Map<string, Set<string>>();
  for (const r of all) for (const k of Object.keys((r[8] as Record<string, number>) ?? {})) if (SYNONYM.test(k)) odd.set(String(r[0]), (odd.get(String(r[0])) ?? new Set()).add(k));
  for (const [b, ks] of odd) warn.push(`board ${b}: metric keys ${[...ks].join(', ')} have a standard name (passAtK, stderr, totalTokens, inputTokens, priceIn, steps)`);
  // data/harnesses.json: names the site uses to tell an agent built around a model from the model on its own
  const harnesses = readJson<{ id: string; name: string; aliases: string[]; maker: string; kind: string }[]>(dataPath('harnesses.json'));
  const seenNames = new Map<string, string>();
  for (const h of harnesses) {
    if (!h.id || !h.name || !Array.isArray(h.aliases) || !h.maker) fail(`harness ${h.id}: needs id, name, aliases and maker`);
    if (!['reference', 'agent'].includes(h.kind)) fail(`harness ${h.id}: kind must be reference or agent`);
    for (const n of [h.id, h.name, ...h.aliases]) {
      const k = n.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seenNames.has(k) && seenNames.get(k) !== h.id) fail(`harness ${h.id}: name ${n} is also ${seenNames.get(k)}`);
      seenNames.set(k, h.id);
    }
  }
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

// data/reviewed.json keeps both lists alphabetical (added by id, rejected by name), so two pull requests that each
// add an entry change different lines of the file instead of the same first or last line
const reviewed = readJson<{ added: { id: string }[]; rejected: { name: string; date: string }[] }>(dataPath('reviewed.json'));
const rejectKey = (r: { name: string; date: string }) => `${r.name.toLowerCase()}\u0000${r.date}`;
const addedAt = reviewed.added.findIndex((a, i) => i > 0 && reviewed.added[i - 1].id > a.id);
if (addedAt > 0) fail(`reviewed.json: the added list is out of order at ${reviewed.added[addedAt].id}. Keep it sorted by id.`);
const rejectedAt = reviewed.rejected.findIndex((r, i) => i > 0 && rejectKey(reviewed.rejected[i - 1]) > rejectKey(r));
if (rejectedAt > 0) fail(`reviewed.json: the rejected list is out of order at ${reviewed.rejected[rejectedAt].name}. Keep it sorted by name.`);

// audits (data/audits.json): published reviews that found problems in benchmarks, shown as "Known issues"
const AUDIT_PROBLEMS = new Set(['broken-grader', 'leaked-answers', 'wrong-labels', 'contamination', 'reward-hacking', 'ignored-input', 'harness-differences', 'underspecified-tasks', 'content-filter']);
const AUDIT_STATUSES = new Set(['fixed-by-maker', 'fixed-in-fork', 'new-version', 'open', 'disputed']);
const audits = readJson<{ id: string; title?: string; author?: string; date?: string; url?: string; source?: string; findings?: { benchmark: string; problems?: string[]; summary?: string; status?: string; see?: string; fixes?: { label?: string; url?: string }[]; response?: { text?: string; url?: string } }[] }[]>(dataPath('audits.json'));
const auditIds = new Set<string>();
for (const a of audits) {
  if (auditIds.has(a.id)) fail(`audit ${a.id}: duplicate id`);
  auditIds.add(a.id);
  if (!a.title?.trim() || !a.author?.trim()) fail(`audit ${a.id}: no title or author`);
  if (!/^\d{4}-\d\d-\d\d$/.test(a.date ?? '')) fail(`audit ${a.id}: bad date ${a.date}`);
  if (!/^https:\/\//.test(a.url ?? '')) fail(`audit ${a.id}: the source must be an https address`);
  if (a.source !== 'write-up' && a.source !== 'paper') fail(`audit ${a.id}: unknown source kind ${a.source}`);
  if (!a.findings?.length) fail(`audit ${a.id}: no findings`);
  for (const f of a.findings ?? []) {
    const at = `audit ${a.id}, ${f.benchmark}`;
    if (!benchIds.has(f.benchmark)) fail(`${at}: unknown benchmark`);
    if (f.see && !benchIds.has(f.see)) fail(`${at}: unknown benchmark in see: ${f.see}`);
    if (!f.problems?.length || f.problems.some((p) => !AUDIT_PROBLEMS.has(p))) fail(`${at}: unknown or missing problem kind ${f.problems}`);
    if (!AUDIT_STATUSES.has(f.status ?? '')) fail(`${at}: unknown status ${f.status}`);
    if (!f.summary?.trim()) fail(`${at}: no summary`);
    for (const x of [...(f.fixes ?? []), ...(f.response ? [f.response] : [])]) if (!/^https:\/\//.test(x.url ?? '')) fail(`${at}: a link is not an https address`);
  }
}

// the first day we saw each new leaderboard score (scripts/first-seen.ts), for the time machine
const DAY = /^\d{4}-\d\d-\d\d$/;
const firstSeenPath = dataPath('scores', 'first-seen.json');
if (existsSync(firstSeenPath)) {
  const fs = readJson<{ since?: string; updated?: string; boards?: Record<string, string>; rows?: unknown[][] }>(firstSeenPath);
  if (!DAY.test(fs.since ?? '') || !DAY.test(fs.updated ?? '')) fail('first-seen.json: bad since or updated day');
  for (const [b, d] of Object.entries(fs.boards ?? {})) {
    if (!benchIds.has(b)) warn.push(`first-seen.json: board of unknown benchmark ${b}`);
    if (!DAY.test(d) || d <= fs.since!) fail(`first-seen.json: board ${b} has a bad first day ${d}`);
  }
  const keys = new Set<string>();
  for (const r of fs.rows ?? []) {
    const [b, entry, setting, harness, day] = r as [string, string, string | null, string | null, string];
    const k = `${b}\t${entry}\t${setting ?? ''}\t${harness ?? ''}`;
    if (keys.has(k)) fail(`first-seen.json: duplicate row ${k.replace(/\t/g, ' | ')}`);
    keys.add(k);
    if (!DAY.test(day ?? '') || day <= fs.since!) fail(`first-seen.json: row ${b} ${entry} has a bad first day ${day}`);
    // a model or benchmark can leave the catalog after we saw it: that's only worth a warning
    if (!benchIds.has(b)) warn.push(`first-seen.json: row of unknown benchmark ${b}`);
    else if (!entry?.startsWith('~') && !modelIds.has(entry)) warn.push(`first-seen.json: row of unknown model ${entry}`);
  }
}

// Arena's text leaderboard on each day it was published (scripts/arena-history.ts), for the time machine
const arenaPath = dataPath('scores', 'arena-history.json');
if (existsSync(arenaPath)) {
  const ah = readJson<{ license?: string; url?: string; retrieved?: string; snapshots?: { date: string; rows: [string, string | null, string | null, number, number][] }[] }>(arenaPath);
  if (ah.license !== 'CC BY 4.0') fail(`arena-history.json: license ${ah.license}, expected CC BY 4.0`);
  if (!/^https:\/\/huggingface\.co\//.test(ah.url ?? '')) fail('arena-history.json: the source must be the Hugging Face dataset');
  if (!DAY.test(ah.retrieved ?? '')) fail('arena-history.json: bad retrieved day');
  let last = '';
  for (const s of ah.snapshots ?? []) {
    if (!DAY.test(s.date) || s.date <= last) fail(`arena-history.json: snapshot ${s.date} is out of order or not a day`);
    last = s.date;
    if (!s.rows.length) fail(`arena-history.json: snapshot ${s.date} has no rows`);
    for (const [name, model, lab, rating] of s.rows) {
      if (!name) fail(`arena-history.json: ${s.date} has a row with no name`);
      if (model && !modelIds.has(model)) fail(`arena-history.json: ${s.date} names unknown model ${model}`);
      if (lab && !labIds.has(lab)) fail(`arena-history.json: ${s.date} names unknown lab ${lab}`);
      if (!Number.isFinite(rating)) fail(`arena-history.json: ${s.date} ${name} has no rating`);
    }
  }
}

// facets: every value is in the codebook, one-value facets hold one string, several-value facets a list, and
// "none" or "unknown" stand alone. Views name only facets and values that exist.
{
  type FacetDef = { key: string; several: boolean; values?: { id: string }[]; codes?: string; named?: string[] };
  const cb = readJson<{ facets: FacetDef[]; facts: { key: string; values: { id: string }[] }[] }>(dataPath('facets-codebook.json'));
  const fx = readJson<{ benchmarks: Record<string, Record<string, unknown>> }>(dataPath('facets.json'));
  const benchIds = new Set(benchmarks.map((b) => b.id as string));
  const allowed = new Map(cb.facets.map((f) => [f.key, new Set((f.values ?? []).map((v) => v.id))]));
  const LANG = /^(?:[a-z]{2,3}|mul|unknown)$/;
  const okValue = (f: FacetDef, v: string) => {
    if (f.codes === 'iso639') return LANG.test(v);
    if (f.named && v.includes(':')) return f.named.includes(v.slice(0, v.indexOf(':'))) && v.slice(v.indexOf(':') + 1).trim().length > 0;
    return allowed.get(f.key)!.has(v);
  };
  for (const [id, f] of Object.entries(fx.benchmarks)) {
    if (!benchIds.has(id)) fail(`facets.json: unknown benchmark ${id}`);
    for (const d of cb.facets) {
      const v = f[d.key];
      if (v === undefined) {
        fail(`facets.json: ${id} has no ${d.key}`);
        continue;
      }
      const vs = d.several ? v : [v];
      if (d.several !== Array.isArray(v) || !(vs as unknown[]).length || (vs as unknown[]).some((x) => typeof x !== 'string')) {
        fail(`facets.json: ${id}.${d.key} must be ${d.several ? 'a non-empty list' : 'one string'}`);
        continue;
      }
      for (const x of vs as string[]) if (!okValue(d, x)) fail(`facets.json: ${id}.${d.key} has unknown value "${x}"`);
      if ((vs as string[]).length > 1 && (vs as string[]).some((x) => x === 'none' || x === 'unknown')) fail(`facets.json: ${id}.${d.key} mixes none or unknown with other values`);
    }
    if (f.construct !== 'propensity' && Array.isArray(f.propensity) && f.propensity.some((x) => x !== 'none')) fail(`facets.json: ${id} names a behavior but does not measure a propensity`);
    if (f.basedOn !== undefined && (!Array.isArray(f.basedOn) || !['version', 'method'].includes(f.basis as string) || (f.basedOn as string[]).some((c) => !benchIds.has(c) || c === id))) fail(`facets.json: ${id}.basedOn must list other benchmark ids, on a version or a method run`);
    if (f.components !== undefined && (!Array.isArray(f.components) || !f.combines || (f.components as string[]).some((c) => !benchIds.has(c)))) fail(`facets.json: ${id}.components must list benchmark ids, on a benchmark that combines others`);
    for (const d of cb.facts) {
      const v = f[d.key];
      if (v === undefined || v === null) continue;
      const ok = new Set(d.values.map((x) => x.id));
      for (const x of Array.isArray(v) ? v : [v]) if (!ok.has(x as string)) fail(`facets.json: ${id}.${d.key} has unknown value "${x}"`);
    }
  }
  const untagged = benchmarks.filter((b) => !fx.benchmarks[b.id as string]).length;
  if (untagged) warn.push(`facets.json: ${untagged} benchmarks have no facets yet`);
  type Rule = { all?: Rule[]; any?: Rule[]; facet?: string; in?: string[] };
  const checkRule = (view: string, r: Rule) => {
    if (r.all || r.any) for (const x of r.all ?? r.any ?? []) checkRule(view, x);
    else {
      const d = cb.facets.find((f) => f.key === r.facet);
      if (!d) return fail(`views.json: ${view} names unknown facet ${r.facet}`);
      for (const v of r.in ?? []) if (!okValue(d, v) && !(d.key === 'subject' && /^[1-6]$/.test(v))) fail(`views.json: ${view} names unknown ${d.key} value "${v}"`);
    }
  };
  const views = readJson<{ views: { id: string; name: string; note: string; rule: Rule }[] }>(dataPath('views.json'));
  for (const v of views.views) {
    if (!/^[a-z0-9-]+$/.test(v.id) || !v.name || !v.note) fail(`views.json: ${v.id} needs an id, a name and a note`);
    checkRule(v.id, v.rule);
  }
}

// launch posts (data/traction.json): known benchmarks, an X post address, counts that are whole numbers or null
{
  const tr = readJson<{ benchmarks: Record<string, { x?: Record<string, unknown> }> }>(dataPath('traction.json'));
  const ids = new Set(benchmarks.map((b) => b.id as string));
  for (const [id, t] of Object.entries(tr.benchmarks)) {
    if (!ids.has(id)) fail(`traction.json: unknown benchmark ${id}`);
    const x = t.x;
    if (!x) continue;
    if (!/^https:\/\/x\.com\/\w+\/status\/\d+$/.test(String(x.url))) fail(`traction.json: ${id} has no X post address`);
    for (const k of ['views', 'likes', 'reposts', 'replies', 'quotes', 'bookmarks'])
      if (x[k] !== null && !(Number.isInteger(x[k]) && (x[k] as number) >= 0)) fail(`traction.json: ${id}.${k} must be a count or null`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(x.read))) fail(`traction.json: ${id} needs the day the counts were read`);
  }
}

// Epoch AI's Benchmark Reviews (data/epoch-reviews.json, scripts/sync-epoch-reviews.ts): known benchmarks, one review
// per Epoch slug, a known verdict, and for a review with a page, its address, date and summary
{
  const er = readJson<{ retrieved?: string; reviews?: Record<string, Record<string, unknown>>; unmatched?: unknown[] }>(dataPath('epoch-reviews.json'));
  const ids = new Set(benchmarks.map((b) => b.id as string));
  const date = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  if (!date(er.retrieved)) fail('epoch-reviews.json: needs the day it was read');
  if (!Array.isArray(er.unmatched)) fail('epoch-reviews.json: needs an unmatched list');
  else if (er.unmatched.length) warn.push(`epoch-reviews.json: Epoch AI reviews with no record: ${er.unmatched.join(', ')}`);
  const slugs = new Set<string>();
  for (const [id, r] of Object.entries(er.reviews ?? {})) {
    if (!ids.has(id)) fail(`epoch-reviews.json: unknown benchmark ${id}`);
    if (typeof r.epoch !== 'string' || !/^[a-z0-9-]+$/.test(r.epoch)) fail(`epoch-reviews.json: ${id} needs Epoch's slug`);
    else if (slugs.has(r.epoch)) fail(`epoch-reviews.json: Epoch's ${r.epoch} review is on two records`);
    else slugs.add(r.epoch);
    if (!['verified', 'flawed', 'not-enough-info'].includes(r.verdict as string)) fail(`epoch-reviews.json: ${id} has an unknown verdict ${String(r.verdict)}`);
    if (r.url !== undefined) {
      if (!/^https:\/\/epoch\.ai\/benchmarks\/[a-z0-9-]+\/review$/.test(String(r.url))) fail(`epoch-reviews.json: ${id} has an odd review address`);
      if (!date(r.reviewed)) fail(`epoch-reviews.json: ${id} needs the review's date`);
      if (typeof r.summary !== 'string' || r.summary.length < 40) fail(`epoch-reviews.json: ${id} needs Epoch's summary`);
    } else if (r.verdict !== 'not-enough-info') fail(`epoch-reviews.json: ${id} is ${String(r.verdict)} but links no review`);
  }
}

if (warn.length) console.log(`${warn.length} warnings, for example:\n  ${warn.slice(0, 5).join('\n  ')}`);
if (errors.length) {
  console.error(`${errors.length} errors:\n  ${errors.slice(0, 50).join('\n  ')}`);
  process.exit(1);
}
console.log(`data/ is consistent: ${labs.length} labs, ${models.length} models, ${benchmarks.length} benchmarks, ${cards.length} launch posts, ${systemCards.length} system cards, ${epoch.rows.length} Epoch scores, ${boards.rows.length} leaderboard scores, ${Object.keys(abstracts).length} paper abstracts, ${audits.length} audits.`);
