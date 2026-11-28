// The Almanac Index's data: the input from the site's data, the frozen versions in data/index/, and the page payload
// with every version's boards and the changelog between versions. The math lives in almanac-index.ts.
import { benchmarks, benchById, models, labById, cards, systemCards, leaderboardScores, epochScores, viaBoardScores, cardScores, bestPerModel, AS_OF } from './data.ts';
import { areaOf } from './taxonomy.ts';
import { facetsOf } from './facets.ts';
import type { Score } from './types.ts';
import { makeRecipe, rank, back, NOT_YET, type IndexInput, type Recipe, type Ranked } from './almanac-index.ts';
import type { IndexPage, Version, Changelog, DomainChange, Change } from './almanac-index-types.ts';

const frozenFiles = import.meta.glob<Recipe>('../../data/index/*.json', { import: 'default', eager: true });

/** The version for a day: YY.MM. */
export const versionOf = (date: string) => `${date.slice(2, 4)}.${date.slice(5, 7)}`;
/** The last day of data a month's version uses: the day before its 1st. */
const cutoffOf = (date: string) => back(`${date.slice(0, 7)}-01`, 1);
/** The first day of the next month. */
const nextMonth = (date: string) => {
  const [y, m] = date.split('-').map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
};

let input: IndexInput | null = null;
export function indexInput(): IndexInput {
  if (input) return input;
  const group = (scores: Score[]) => {
    const m = new Map<string, Score[]>();
    for (const s of scores) if (s.model) (m.get(s.benchmark) ?? m.set(s.benchmark, []).get(s.benchmark)!).push(s);
    return m;
  };
  // independent runs: leaderboards, Epoch AI's own runs, and boards Epoch AI copied. Its collected claims stay out,
  // and so do harness entries, which leaderboardScores leaves to systemScores.
  const indBy = group([...leaderboardScores, ...epochScores, ...viaBoardScores]);
  const labBy = group(cardScores);
  const best = (by: Map<string, Score[]>, id: string) => {
    const b = benchById.get(id)!;
    return Object.fromEntries(bestPerModel(by.get(id) ?? [], b).map((s) => [s.model, s.value]));
  };
  input = {
    asOf: AS_OF,
    benches: benchmarks.map((b) => {
      const f = facetsOf(b.id);
      return {
        id: b.id,
        name: b.name,
        family: b.family ?? null,
        area: areaOf(b.category),
        category: b.category ?? '',
        subcategory: b.subcategory ?? '',
        unit: b.unit ?? '%',
        better: b.better === 'lower' ? 'lower' : 'higher',
        successor: b.successor ?? null,
        released: b.released ?? '',
        construct: f?.construct ?? null,
        risk: f?.risk ?? [],
        propensity: f?.propensity ?? [],
        combines: !!f?.combines,
        runner: f?.runner ?? null,
        basis: f?.basis ?? null,
        subject: f?.subject ?? [],
      };
    }),
    models: models.map((m) => ({ id: m.id, name: m.name, lab: m.lab ?? '', labName: (m.lab && labById.get(m.lab)?.name) || m.lab || '', released: m.released ?? '' })),
    ind: Object.fromEntries([...indBy.keys()].map((id) => [id, best(indBy, id)])),
    lab: Object.fromEntries([...labBy.keys()].map((id) => [id, best(labBy, id)])),
    cites: [...cards, ...systemCards].flatMap((c) =>
      c.results.map((r) => ({ bench: r.benchmark, kind: c.kind === 'launch' ? ('launch' as const) : ('system-card' as const), release: c.release ?? c.id, lab: c.lab, date: c.date })),
    ),
  };
  return input;
}

/** The versions the page shows: every frozen one, the one in force today (computed if the sync has not frozen it
 *  yet), and a preview of next month's from the data through today. */
export function recipes(): { recipes: Recipe[]; main: string } {
  const inp = indexInput();
  const frozen = new Map(Object.values(frozenFiles).map((r) => [r.version, r]));
  const main = versionOf(inp.asOf);
  if (!frozen.has(main)) frozen.set(main, makeRecipe(inp, main, cutoffOf(inp.asOf)));
  const next = versionOf(nextMonth(inp.asOf));
  const list = [...frozen.values()].filter((r) => r.version <= main).sort((a, b) => a.version.localeCompare(b.version));
  list.push(makeRecipe(inp, next, inp.asOf));
  return { recipes: list, main };
}

/** The recipe the sync freezes on the 1st: the version in force on the data's date. */
export function currentRecipe(): Recipe {
  const { recipes: list, main } = recipes();
  return list.find((r) => r.version === main)!;
}

// ---- the page payload --------------------------------------------------------------------------------------------

const THIN = 5;
const SHOW = 80;

const WHY_IN: Record<string, string> = {
  'fewer than 8 models scored': 'reached 8 scored models',
  'nobody scores yet: the top three average under 5%': 'models started to score on it',
};

let page: IndexPage | null = null;
export function indexPageData(): IndexPage {
  if (page) return page;
  const inp = indexInput();
  const { recipes: list, main } = recipes();
  const bench = new Map(inp.benches.map((b) => [b.id, b]));
  const model = new Map(inp.models.map((m) => [m.id, m]));
  const current = back(inp.asOf, 365);
  const cur = (m: string) => (model.get(m)?.released ?? '') > current;
  const used = new Set<string>();
  const ranked = new Map(list.map((r) => [r.version, rank(inp, r)]));

  const versionPage = (R: Ranked): Version => {
    const r = R.recipe;
    const head = R.head.filter((x) => cur(x.model));
    const rows = head.map((x, k) => ({ m: x.model, rank: k + 1, v: x.value, first: x.first, doms: x.domains, share: x.share, parts: x.parts }));
    rows.forEach((x) => used.add(x.m));
    const domains = r.domains.map((d) => {
      const all = (R.domainRows.get(d.id) ?? []).filter((x) => cur(x.model));
      const drows = all.slice(0, 20).map((x, k) => ({ m: x.model, rank: k + 1, v: x.value, first: x.first, ref: x.refTests, n: x.tests, ev: x.evidence, parts: x.parts, pred: x.pred }));
      drows.forEach((x) => used.add(x.m));
      const refIds = d.ref.map(([b]) => b).filter((b) => R.best.has(b));
      const tot = refIds.reduce((t, b) => t + r.tests[b][0], 0) || 1;
      const tests = refIds.map((b) => {
        const f = r.tests[b];
        used.add(R.best.get(b)![0]);
        return { id: b, name: bench.get(b)?.name ?? b, weight: Math.round((f[0] / tot) * 1e4) / 1e4, relevance: f[1], launchLabs: f[2], cardLabs: f[3], labs: f[4], releases: f[5], independent: f[6], current: f[7], unit: bench.get(b)?.unit ?? '%', best: R.best.get(b)! };
      });
      return { id: d.id, name: d.name, group: d.group, pool: d.pool.length, weight: r.weights[d.id] ?? 0, thin: all.length < THIN, ranked: all.length, tests, rows: drows };
    });
    // the strengths view: the top of the index and every domain leader
    const profile = rows.slice(0, 14).map((x) => x.m);
    for (const d of domains) if (d.rows.length && !d.thin && !profile.includes(d.rows[0].m)) profile.push(d.rows[0].m);
    const place: Version['place'] = {};
    for (const m of profile) {
      const p: Version['place'][string] = {};
      for (const d of r.domains) {
        const all = (R.domainRows.get(d.id) ?? []).filter((x) => cur(x.model));
        const k = all.findIndex((x) => x.model === m);
        if (k >= 0) p[d.id] = { rank: k + 1, of: all.length, v: all[k].value, gap: Math.round((all[k].value - all[0].value) * 10) / 10, ev: all[k].evidence, n: all[k].tests };
      }
      place[m] = p;
    }
    profile.forEach((m) => used.add(m));
    const provisional = R.provisional.filter((x) => cur(x.model)).map((x) => ({ m: x.model, v: x.value, doms: x.domains, share: x.share, parts: x.parts }));
    provisional.forEach((x) => used.add(x.m));
    const dropped: Record<string, number> = {};
    for (const [w, ids] of Object.entries(r.status)) if (w !== NOT_YET) dropped[w] = ids.length;
    return {
      version: r.version,
      cutoff: r.cutoff,
      preview: r.version > main,
      frozen: r.frozen,
      rebuilt: r.rebuilt && r.version <= main,
      pool: Object.keys(r.tests).length,
      dropped,
      settings: {
        current,
        minModels: r.settings.minModels,
        saturated: r.settings.saturated,
        perDomain: r.settings.perDomain,
        signals: r.settings.signals,
        fitModels: R.fitModels,
        domainShare: r.settings.domainShare,
        draws: r.settings.draws,
      },
      headline: { rows, provisional, weights: r.weights },
      domains,
      profile,
      place,
      ranking: r.ranking.slice(0, SHOW).map((x) => {
        const f = r.tests[x.id];
        return { id: x.id, name: bench.get(x.id)?.name ?? x.id, relevance: x.relevance, launchLabs: f[2], cardLabs: f[3], releases: f[5], independent: f[6], current: f[7], versions: x.versions, domains: x.domains, signal: x.signal };
      }),
    };
  };

  /** Why a test could not count in a version: null when it could, undefined when the version had not seen it. */
  const statusOf = (r: Recipe, b: string): string | null | undefined => {
    if (r.tests[b]) return null;
    for (const [w, ids] of Object.entries(r.status)) if (ids.includes(b)) return w;
    return undefined;
  };
  const useChange = (l0: number, l1: number, c0: number, c1: number) =>
    `cited by ${l1} ${l1 === 1 ? 'lab' : 'labs'}` + (l1 !== l0 ? `, ${l1 > l0 ? 'up' : 'down'} from ${l0}` : '') + `, ${c1} current models` + (c1 !== c0 ? `, ${c1 > c0 ? 'up' : 'down'} from ${c0}` : '');

  const changelog = (A: Ranked, B: Ranked): Changelog => {
    const o = A.recipe, n = B.recipe;
    const per = n.settings.perDomain;
    const lead = (R: Ranked, id: string) => (R.domainRows.get(id) ?? []).find((x) => cur(x.model))?.model ?? null;
    const name = (b: string) => bench.get(b)?.name ?? b;
    const out: DomainChange[] = [];
    for (const d of n.domains) {
      const od = o.domains.find((x) => x.id === d.id);
      if (!od) continue;
      const ot = new Map(od.ref), nt = new Map(d.ref);
      const og = new Map(od.ref.map(([b, g]) => [g, b])), ng = new Map(d.ref.map(([b, g]) => [g, b]));
      const ins: Change[] = [], outs: Change[] = [];
      for (const [b, g] of nt) {
        if (ot.has(b)) continue;
        if (og.has(g)) {
          ins.push({ name: name(b), why: `newer version of ${name(og.get(g)!)}, which labs now cite more` });
          continue;
        }
        const was = statusOf(o, b);
        let why: string;
        if (was === undefined || was === NOT_YET) why = 'released since the last version';
        else if (was !== null) why = WHY_IN[was] ?? `was left out: ${was}`;
        else if (o.tests[b][7] < o.settings.refCurrent) why = 'reached five current models';
        else why = `rose into the top ${per}: ` + useChange(o.tests[b][4], n.tests[b][4], o.tests[b][7], n.tests[b][7]);
        ins.push({ name: name(b), why });
      }
      for (const [b, g] of ot) {
        if (nt.has(b) || ng.has(g)) continue; // a version swap shows once, on the way in
        const now = statusOf(n, b);
        let why: string;
        if (now) why = now;
        else if (now === undefined) why = 'no longer in this domain';
        else if (n.tests[b][7] < n.settings.refCurrent) why = 'fewer than five current models';
        else why = `fell below the top ${per}: ` + useChange(o.tests[b][4], n.tests[b][4], o.tests[b][7], n.tests[b][7]) + ', and other tests gained more';
        outs.push({ name: name(b), why });
      }
      const lo = lead(A, d.id), ln = lead(B, d.id);
      const w0 = o.weights[d.id] ?? 0, w1 = n.weights[d.id] ?? 0;
      if (ins.length || outs.length || lo !== ln || Math.abs(w0 - w1) >= 0.005) out.push({ id: d.id, name: d.name, in: ins, out: outs, leader: [lo, ln], weight: [w0, w1] });
    }
    const oh = A.head.filter((x) => cur(x.model)).slice(0, 5).map((x) => x.model);
    const nh = B.head.filter((x) => cur(x.model)).slice(0, 5).map((x) => x.model);
    for (const m of [...oh, ...nh, ...out.flatMap((c) => c.leader)]) if (m) used.add(m);
    return { from: o.version, to: n.version, domains: out, top: [oh, nh], pool: [Object.keys(o.tests).length, Object.keys(n.tests).length] };
  };

  const order = list.map((r) => r.version);
  const versions = Object.fromEntries(order.map((v) => [v, versionPage(ranked.get(v)!)]));
  const changes = Object.fromEntries(order.slice(1).map((v, i) => [v, changelog(ranked.get(order[i])!, ranked.get(v)!)]));
  page = {
    main,
    asOf: inp.asOf,
    order,
    versions,
    changes,
    models: Object.fromEntries([...used].filter((m) => model.has(m)).map((m) => { const x = model.get(m)!; return [m, [x.name, x.lab, x.labName, x.released]]; })),
  };
  return page;
}
