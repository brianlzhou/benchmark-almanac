// The index behind the home page search box, built once at build time and served as two static files:
//   /search.json        every benchmark, model page, lab page, category and site page, with the other
//                       spellings each goes by (small, so the first keystroke never waits long)
//   /search-words.json  the key words of each benchmark's description, one string per row of the first
//                       file, loaded after it so words like "chess" or "OpenUSD" also find benchmarks
// Both carry the same version key, so the browser never pairs words with the rows of another build.
import { benchmarks, labs, labById, featuredModels, cardScores, leaderboardScores, epochScores, collectedScores, cards, systemCards } from './data.ts';
import { AREAS, CATEGORY_NAMES, SUBCATEGORIES, areaOf } from './taxonomy.ts';
import { monthYear } from './format.ts';

/** [name, url, kind, detail, other spellings, weight, more words to match]
 * kind: b benchmark, m model, l lab, c category, p page
 * weight orders rows that match the query equally well. For a benchmark it is the launch posts that list it, then
 * the system cards, then the release month, so the most-cited version of a test comes first and the detail line
 * says how often it is cited. For a model it is the release date, so the newest comes first. See
 * src/scripts/search-rank.ts. */
export type SearchRow = [string, string, 'b' | 'm' | 'l' | 'c' | 'p', string, string, number, string];

const STOP = new Set(
  'the and for with from that this into over than then them they their what when where which while who whom whose are was were has have had not but its can each how out per via about across after all also any both does done each more most much one only other own same some such two use used uses using very within without would'.split(
    ' ',
  ),
);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
// the distinct words of a text worth matching on: no stop words, nothing under three letters
const words = (...texts: (string | undefined)[]) => [...new Set(norm(texts.filter(Boolean).join(' ')).split(' '))].filter((w) => w.length >= 3 && !STOP.has(w));
const weight = (n: number) => Math.round(Math.log2(n + 1) * 10) / 10;

let built: { v: string; rows: SearchRow[]; words: string[] } | null = null;

export function searchIndex() {
  if (built) return built;
  const uses = new Map<string, number>();
  const modelUses = new Map<string, number>();
  for (const s of [...cardScores, ...leaderboardScores, ...epochScores, ...collectedScores]) {
    uses.set(s.benchmark, (uses.get(s.benchmark) ?? 0) + 1);
    modelUses.set(s.model, (modelUses.get(s.model) ?? 0) + 1);
  }
  const labPages = new Set(featuredModels.map((m) => m.lab).filter(Boolean));
  const catCount = new Map<string, number>();
  const subCount = new Map<string, number>();
  for (const b of benchmarks) {
    catCount.set(b.category ?? 'other', (catCount.get(b.category ?? 'other') ?? 0) + 1);
    if (b.subcategory) subCount.set(b.subcategory, (subCount.get(b.subcategory) ?? 0) + 1);
  }
  const n = (k: number, one: string, many: string) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;
  // the documents that cite each benchmark: launch posts, then system cards
  const cited = (docs: { results: { benchmark: string }[] }[]) => {
    const m = new Map<string, number>();
    for (const d of docs) for (const id of new Set(d.results.map((r) => r.benchmark))) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  };
  const launchPosts = cited(cards);
  const sysCards = cited(systemCards);
  const areaName = (cat: string) => AREAS.find((a) => a.id === areaOf(cat))?.name ?? '';

  const rows: SearchRow[] = [];
  const extra: string[] = [];
  for (const b of benchmarks) {
    const lp = launchPosts.get(b.id) ?? 0;
    const sc = sysCards.get(b.id) ?? 0;
    const cites = lp ? n(lp, 'launch post', 'launch posts') : sc ? n(sc, 'system card', 'system cards') : '';
    // the count first: a long maker name is cut off at the end of the line, and the count explains the order
    const detail = [cites, [CATEGORY_NAMES[b.category ?? ''] ?? '', b.org ?? ''].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    const aliases = (b.aliases ?? []).join(' | ');
    // launch posts, then system cards, then scores, then the newer release
    const month = Number((b.released ?? '').replace(/\D/g, '').slice(0, 6).padEnd(6, '0')) || 0;
    const w = lp * 1e4 + Math.min(sc, 99) * 100 + Math.min(99, uses.get(b.id) ?? 0) * 0.9 + month / 1e6;
    rows.push([b.name, `/benchmarks/${b.id}/`, 'b', detail, aliases, Math.round(w * 1e4) / 1e4, '']);
    // only the description words the row does not already show
    const seen = new Set(words(b.name, aliases, detail));
    extra.push(words(b.description).filter((w) => !seen.has(w)).join(' '));
  }
  for (const m of featuredModels) {
    const lab = labById.get(m.lab ?? '');
    rows.push([
      m.name,
      `/models/${m.id}/`,
      'm',
      [lab?.name, m.released ? monthYear(m.released) : undefined].filter(Boolean).join(', '),
      (m.aliases ?? []).join(' | '),
      // models that match equally well: the newest first, then the most scored
      Number((m.released ?? '').replace(/\D/g, '').slice(0, 8).padEnd(8, '0')) / 1e4 + weight(modelUses.get(m.id) ?? 0) / 1e6,
      words(...(lab?.aliases ?? [])).join(' '),
    ]);
  }
  for (const l of labs.filter((l) => labPages.has(l.id)))
    rows.push([l.name, `/labs/${l.id}/`, 'l', n(featuredModels.filter((m) => m.lab === l.id).length, 'model', 'models'), (l.aliases ?? []).join(' | '), 9, '']);
  for (const a of AREAS.filter((a) => a.id !== 'other')) rows.push([a.name, `/benchmarks/?area=a:${a.id}`, 'c', 'Area', '', 8, words(a.question).join(' ')]);
  for (const [id, k] of catCount) rows.push([CATEGORY_NAMES[id] ?? id, `/categories/${id}/`, 'c', `${areaName(id)}, ${n(k, 'benchmark', 'benchmarks')}`, '', 8, '']);
  for (const [cat, subs] of Object.entries(SUBCATEGORIES))
    for (const s of subs.filter((s) => subCount.has(s.id) && norm(s.name) !== norm(CATEGORY_NAMES[cat] ?? '')))
      rows.push([s.name, `/benchmarks/?area=s:${s.id}`, 'c', `${CATEGORY_NAMES[cat] ?? cat}, ${n(subCount.get(s.id)!, 'benchmark', 'benchmarks')}`, '', 7, '']);
  const pages = [
    ['All benchmarks', '/benchmarks/', 'The full table, with filters', 'benchmarks table catalog list'],
    ['Leaders', '/leaders/', 'Who held number one', 'number one top spot reign leaderboard'],
    ['Arenas', '/arenas/', 'Ranked by people and matches', 'arena elo vote preference head to head lmarena'],
    ['Models', '/models/', 'Every model with a page', 'models capabilities index eci'],
    ['Labs', '/labs/', 'Every lab with a page', 'labs companies developers'],
    ['Model cards', '/cards/', 'Launch posts and system cards', 'cards launch posts system cards technical reports'],
    ['New', '/new/', 'Added, waiting and left out, and new models', 'new recent added queue discovery models releases'],
    ['Audits', '/audits/', 'Known issues that audits found in benchmarks', 'audits known issues problems broken grader leaked answers wrong labels contamination errors'],
    ['Sources', '/sources/', 'Where we find new benchmarks', 'sources feeds newsletters'],
    ['About', '/about/', 'How this works', 'about method methodology how this works faq'],
  ] as const;
  for (const [name, url, detail, w] of pages) rows.push([name, url, 'p', detail, '', 6, w]);
  while (extra.length < rows.length) extra.push('');

  // the version key: a short hash of every row's address, in order
  let h = 2166136261;
  for (const r of rows) for (let i = 0; i < r[1].length; i++) h = Math.imul(h ^ r[1].charCodeAt(i), 16777619);
  built = { v: (h >>> 0).toString(36), rows, words: extra };
  return built;
}

export const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
