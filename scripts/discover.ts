// Finds new benchmarks and writes data/discovered.json, a review queue.
//
// Every source in data/sources.json with `automated: true` has a reader here (the `id` matches). Each
// reader uses only official feeds and APIs, within the source's terms and robots.txt, and runs under its
// own time limit, so one slow or failing source cannot stop the run. Sources whose terms forbid automated
// reading (Artificial Analysis, Scale's SEAL pages) have no reader, and their `manual` field says why. X is never
// fetched: the `x` reader asks Grok Build, signed in on a maintainer's computer, to search it (scripts/lib/discover/x.ts).
//
// Scoring follows a two-stage rule measured on the week of 2026-10-25:
//   Stage A asks whether an item is a new benchmark at all (precision 0.91 at 5 points or more).
//   Stage B sums evidence across sources. 8 points or more: catalog it. 5 to 7: watch it for 14 days.
// Names already in data/benchmarks.json are skipped.
//
// usage: node scripts/discover.ts [--days 3] [--only <source id>] [--dry]
//   --only runs one reader, even for a source not yet marked automated. --dry writes nothing and lists the finds.
import { readJson, writeJson, dataPath, daysAgo, githubHeaders } from './lib/util.ts';
import { FROM, TODAY, knownFind, byKey, seen, storePath, stageB, makeReader, papersForCatalog, type Candidate, type Reader, type Store, type Tally } from './lib/discover/core.ts';
import { hfDailyPapers, arxiv, openreview } from './lib/discover/papers.ts';
import { ainews, zvi, importAi, epochSubstack, interconnects, semianalysis, dwarkesh, primeBlog } from './lib/discover/newsletters.ts';
import { saveAudits } from './lib/discover/audits.ts';
import { bluesky } from './lib/discover/social.ts';
import { xGrok } from './lib/discover/x.ts';
import { epochHub, inspectEvals, hfOfficial, harbor, primeHub, everyEvalEver, vlmevalkit, awesomeAiLeaderboard, awesomeCua, benchmarkList, hfBenchmarkResults } from './lib/discover/registries.ts';
import { vals, arena } from './lib/discover/leaderboards.ts';
import { labs } from './lib/discover/labs.ts';

// source id in data/sources.json -> its reader and time limit
const READERS: Record<string, { run: (r: Reader) => Promise<void>; seconds?: number }> = {
  'latent-space-ainews': { run: ainews },
  zvi: { run: zvi },
  'import-ai': { run: importAi },
  'epoch-substack': { run: epochSubstack },
  interconnects: { run: interconnects },
  semianalysis: { run: semianalysis },
  dwarkesh: { run: dwarkesh },
  'prime-intellect-blog': { run: primeBlog },
  bluesky: { run: bluesky, seconds: 120 },
  x: { run: xGrok, seconds: 600 },
  'hf-daily-papers': { run: hfDailyPapers },
  arxiv: { run: arxiv, seconds: 150 },
  'openreview-eval-track': { run: openreview, seconds: 120 },
  'epoch-hub': { run: epochHub, seconds: 150 },
  'inspect-evals': { run: inspectEvals },
  'harbor-hub': { run: harbor },
  'prime-hub': { run: primeHub },
  'every-eval-ever': { run: everyEvalEver },
  'hf-official-benchmarks': { run: hfOfficial },
  'hf-benchmark-results': { run: hfBenchmarkResults, seconds: 180 },
  vlmevalkit: { run: vlmevalkit },
  vals: { run: vals },
  lmarena: { run: arena },
  'lab-cards': { run: labs, seconds: 150 },
  'awesome-ai-leaderboard': { run: awesomeAiLeaderboard },
  'awesome-cua': { run: awesomeCua },
  benchmarklist: { run: benchmarkList },
};
const DEFAULT_SECONDS = 90;

const log = (...a: unknown[]) => console.log(...a);
const arg = (f: string) => (process.argv.includes(f) ? (process.argv[process.argv.indexOf(f) + 1] ?? '') : undefined);
const ONLY = arg('--only');
const DRY = process.argv.includes('--dry');
const sources = readJson<{ id: string; name: string; automated: boolean }[]>(dataPath('sources.json'));
const missing = sources.filter((s) => s.automated && !READERS[s.id]).map((s) => s.id);
if (missing.length) log(`  No reader for automated sources: ${missing.join(', ')}`);
if (ONLY !== undefined && !READERS[ONLY]) throw new Error(`no reader for "${ONLY}". Readers: ${Object.keys(READERS).join(', ')}`);
const toRun = sources.filter((s) => (ONLY ? s.id === ONLY : s.automated && READERS[s.id]));

interface Result {
  id: string;
  name: string;
  status: string;
  seconds: number;
  tally: Tally;
}

async function runReader(id: string, name: string): Promise<Result> {
  const spec = READERS[id];
  const ctrl = new AbortController();
  const r = makeReader(id, ctrl.signal);
  const limit = (spec.seconds ?? DEFAULT_SECONDS) * 1000;
  const t0 = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let status = 'ok';
  try {
    await Promise.race([
      spec.run(r),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          ctrl.abort();
          reject(new Error(`timed out after ${limit / 1000} s`));
        }, limit);
      }),
    ]);
  } catch (e) {
    status = `failed: ${(e as Error).message ?? e}`.slice(0, 160);
  } finally {
    clearTimeout(timer);
    r.close(status === 'ok');
  }
  return { id, name, status, seconds: (Date.now() - t0) / 1000, tally: r.tally };
}

/** Stars for finds with a GitHub repo, within a time budget so a long queue cannot stretch the run. */
async function githubStars(cands: Candidate[], budgetMs = 60_000) {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) return;
  const stop = Date.now() + budgetMs;
  const repos = cands.filter((c) => /github\.com\/[\w.-]+\/[\w.-]+/.test(c.repo ?? ''));
  for (let i = 0; i < repos.length && Date.now() < stop; i += 8)
    await Promise.all(
      repos.slice(i, i + 8).map(async (c) => {
        const m = c.repo!.match(/github\.com\/([\w.-]+\/[\w.-]+)/)!;
        try {
          const res = await fetch(`https://api.github.com/repos/${m[1].replace(/\.git$/, '')}`, { headers: githubHeaders(), signal: AbortSignal.timeout(15_000) });
          const j = res.ok ? ((await res.json()) as { stargazers_count?: number }) : null;
          if (j?.stargazers_count !== undefined) c.stars = j.stargazers_count;
        } catch {
          // stars are a bonus signal; a failed lookup leaves the find as it was
        }
      }),
    );
}

// ---- run -------------------------------------------------------------------------------------------
const started = Date.now();
log(`Discovering benchmarks from ${FROM} to ${TODAY}${DRY ? ' (dry run: nothing is written)' : ''}`);
const before = new Map([...new Set(byKey.values())].map((c) => [c, JSON.stringify(c)]));
const settled = await Promise.allSettled(toRun.map((s) => runReader(s.id, s.name)));
const results = settled.flatMap((s) => (s.status === 'fulfilled' ? [s.value] : []));

const all = [...new Set(byKey.values())];
if (!DRY) await githubStars(all.filter((c) => c.last === TODAY && !c.stars));
const items = all
  .map((c) => {
    c.score = stageB(c);
    c.decision = c.score >= 8 ? 'catalog' : 'watch';
    return c;
  })
  // watch items leave after 14 quiet days, catalog items after 60 or once they join the registry
  // a find once marked as a namesake of a record is checked again, so a later rule that links it to the record removes
  // it. Only a find that introduced its benchmark is ever marked, and the queue does not store that flag, so it is set.
  .filter((c) => c.score >= 5 && !knownFind(c.sameNameAs ? { ...c, sameNameAs: undefined, introduced: true } : c) && c.last >= daysAgo(c.decision === 'catalog' ? 60 : 14))
  .sort((a, b) => Number(b.decision === 'catalog') - Number(a.decision === 'catalog') || b.score - a.score || b.last.localeCompare(a.last));

const papers = papersForCatalog();
if (papers.length) log(`\n${papers.length} papers for benchmarks the almanac catalogs without one:\n${papers.map((p) => `  ${p.benchmark}: ${p.title.slice(0, 80)} ${p.url}`).join('\n')}`);
const out: Store = { updated: TODAY, items, seen, ...(papers.length ? { papers } : {}) };
if (DRY) {
  const touched = items.filter((c) => before.get(c) !== JSON.stringify(c));
  for (const c of touched)
    log(`  ${c.decision === 'catalog' ? '*' : ' '} ${String(c.score).padStart(2)}  ${c.name}  [${[...c.curated.map((s) => s.source), ...c.registries.map((s) => s.source), ...c.feeds].join(', ')}]  ${c.url}`);
} else writeJson(storePath, out);

// one line per source: items read, finds that are new to the almanac, and finds already cataloged
const pad = (s: string | number, n: number) => String(s).padEnd(n);
const padL = (s: string | number, n: number) => String(s).padStart(n);
log(`\n${pad('Source', 42)}${padL('Read', 6)}${padL('Finds', 7)}${padL('Known', 7)}${padL('Secs', 7)}  Status`);
for (const r of results.sort((a, b) => b.tally.candidates - a.tally.candidates || a.name.localeCompare(b.name))) {
  const notes = r.tally.notes.length ? ` (${[...new Set(r.tally.notes)].join('; ')})` : '';
  log(`${pad(r.name.slice(0, 40), 42)}${padL(r.tally.read, 6)}${padL(r.tally.candidates, 7)}${padL(r.tally.known, 7)}${padL(r.seconds.toFixed(1), 7)}  ${r.status}${notes}`);
}
// possible audits of cataloged benchmarks, which the readers noted along the way (scripts/lib/discover/audits.ts)
const audits = saveAudits(DRY);
if (audits.length) {
  log(`\n${DRY ? 'Would queue' : 'Queued'} ${audits.length} possible audits:`);
  for (const a of audits) log(`  ${String(a.score).padStart(2)}  ${a.title.slice(0, 90)}  [${a.source}; ${a.benchmarks.slice(0, 4).join(', ')}; ${a.problems.join(', ')}]  ${a.url}`);
}
const cat = items.filter((c) => c.decision === 'catalog').length;
const failed = results.filter((r) => r.status !== 'ok').length;
log(
  `\n${DRY ? 'Would write' : 'Wrote'} ${items.length} candidates (${cat} to catalog, ${items.length - cat} on the watch list) in ${((Date.now() - started) / 1000).toFixed(0)} s.` +
    (failed ? ` ${failed} source${failed === 1 ? '' : 's'} failed and kept their last lists.` : ''),
);
