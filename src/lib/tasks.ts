// Open tasks an outside contributor can pick up: gaps in data/ that one source can fill, and leaderboards that
// need an importer. The /contribute/ page lists them with a prefilled GitHub issue form for each, and
// scripts/tasks.ts prints them or turns some into "good first issue" issues.
//
// This file imports no data, so the page (through src/lib/data.ts) and a plain Node script (reading the JSON
// files) can both call `openTasks` with the same records.

import { REPO } from './criteria.ts';
import type { Benchmark, Model } from './types.ts';

export type TaskKind = 'leaderboard' | 'release' | 'level' | 'paper' | 'model-release' | 'review' | 'critique' | 'importer' | 'broken';

export interface Task {
  /** Stable across runs, "<kind>:<record id>", so an issue can name the task it tracks. */
  id: string;
  kind: TaskKind;
  /** The record's name, as the site shows it. */
  name: string;
  /** The almanac page the task is about. */
  page: string;
  /** One sentence on what's missing. */
  detail: string;
  /** A prefilled GitHub issue form, or for code tasks the guide to start from. */
  action: string;
  /** A second link: the leaderboard, the importer file or the paper. */
  extra?: { label: string; url: string };
  /** For a pull request: the file and the field to change. */
  file: string;
  field?: string;
  /** Higher first: how many labs report the benchmark, or how many scores a model has. */
  rank: number;
}

export interface TaskGroup {
  kind: TaskKind;
  /** A sentence with the count, used as the section heading. */
  title: string;
  /** What to do, in one or two sentences. */
  how: string;
  /** The label of each task's main link. */
  verb: string;
  /** Code tasks are pull requests. The rest are issue forms. */
  code: boolean;
  tasks: Task[];
}

/** A benchmark the discovery job found that isn't cataloged yet (data/discovered.json). */
export interface Find {
  key: string;
  name: string;
  title: string;
  url: string;
  decision: string;
  feeds: string[];
  arxiv?: string;
  repo?: string;
  sameNameAs?: string;
}

/** A write-up that may criticize a cataloged benchmark (data/discovered-audits.json). */
export interface AuditFind {
  key: string;
  title: string;
  url: string;
  benchmarks: string[];
}

export interface TaskInput {
  /** The public site, for the page links in prefilled forms. */
  site: string;
  benchmarks: Benchmark[];
  models: Model[];
  /** Launch posts and system cards: which lab named which benchmark. */
  docs: { lab: string; results: { benchmark: string }[] }[];
  /** The boards scripts/sync-leaderboards.ts reads, by benchmark id. */
  boards: Record<string, { retrieved?: string | null; failed?: { date: string; error: string } }>;
  /** Benchmarks with Epoch AI runs. */
  epoch: Set<string>;
  /** Models with a page of their own. */
  modelPages: Set<string>;
  /** Scores per model, to put well-known models first. */
  modelScores: Map<string, number>;
  /** The difficulty levels' names, easiest first. */
  levels: string[];
  finds: Find[];
  /** Names the review left out (data/reviewed.json). */
  rejected: string[];
  audits: AuditFind[];
}

const GUIDE = `${REPO}/blob/main/.github/CONTRIBUTING.md#add-a-leaderboard-importer`;
const form = (template: string, fields: Record<string, string>) => `${REPO}/issues/new?${new URLSearchParams({ template, ...fields })}`;
const isPublic = (b: Benchmark) => b.access === 'public' || b.access === 'public+private-holdout';
/** Artificial Analysis's terms keep its numbers out of the almanac, so its boards never get importers. */
const NO_IMPORT = /artificialanalysis\.ai/;

/** The name key the data scripts use (scripts/lib/util.ts and the New page), so a cataloged find drops off. */
export const nameKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/(\d)\.0\b/g, '$1')
    .replace(/\b(benchmark|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '');

/** The boards whose importer failed: recorded by the sync, or last read before the most recent full sync. */
function brokenBoards(boards: TaskInput['boards']): Map<string, { date: string; error: string }> {
  const count = new Map<string, number>();
  for (const b of Object.values(boards)) if (b.retrieved) count.set(b.retrieved, (count.get(b.retrieved) ?? 0) + 1);
  // the date most boards share is the last full sync. A partial run touches only a few boards.
  const full = [...count.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0] ?? '';
  const out = new Map<string, { date: string; error: string }>();
  for (const [id, b] of Object.entries(boards)) {
    if (b.failed) out.set(id, b.failed);
    else if (b.retrieved && b.retrieved < full) out.set(id, { date: b.retrieved, error: '' });
  }
  return out;
}

export function openTasks(input: TaskInput): TaskGroup[] {
  const { site, benchmarks, models } = input;
  const benchPage = (b: Benchmark) => `${site}/benchmarks/${b.id}/`;
  const labsBy = new Map<string, Set<string>>();
  for (const d of input.docs) for (const r of d.results) (labsBy.get(r.benchmark) ?? labsBy.set(r.benchmark, new Set()).get(r.benchmark)!).add(d.lab);
  const nLabs = (id: string) => labsBy.get(id)?.size ?? 0;
  const read = (id: string) => !!input.boards[id] || input.epoch.has(id);
  const byRank = (a: Task, b: Task) => b.rank - a.rank || a.name.localeCompare(b.name);

  const bench = (kind: TaskKind, b: Benchmark, detail: string, action: string, field?: string, extra?: Task['extra']): Task => ({
    id: `${kind}:${b.id}`,
    kind,
    name: b.name,
    page: benchPage(b),
    detail,
    action,
    extra,
    file: 'data/benchmarks.json',
    field,
    rank: nLabs(b.id),
  });
  const correction = (b: Benchmark, what: string, wrong: string) =>
    form('correction.yml', { title: `Correction: ${what} of ${b.name}`, page: benchPage(b), wrong });

  // 1. public benchmarks two or more labs report, with no leaderboard we know of
  const leaderboard = benchmarks
    .filter((b) => isPublic(b) && nLabs(b.id) >= 2 && !b.links?.leaderboard && !read(b.id))
    .map((b) =>
      bench(
        'leaderboard',
        b,
        `${nLabs(b.id)} labs report it, and we know of no leaderboard that ranks it.`,
        correction(b, 'leaderboard', `${b.name} has no leaderboard linked. Its results are ranked at: `),
        'links.leaderboard',
      ),
    );

  // 2. benchmarks with no release date
  const release = benchmarks
    .filter((b) => !b.released)
    .map((b) => bench('release', b, 'No release date.', correction(b, 'release date', `${b.name} has no release date. It was released in YYYY-MM.`), 'released'));

  // 3. benchmarks with no difficulty level
  const levelList = input.levels.length > 1 ? `${input.levels.slice(0, -1).join(', ')} or ${input.levels.at(-1)}` : input.levels.join('');
  const level = benchmarks
    .filter((b) => !b.level)
    .map((b) =>
      bench('level', b, 'No difficulty level.', correction(b, 'level', `${b.name} has no difficulty level. It should be ${levelList}, because `), 'level'),
    );

  // 4. public benchmarks with no paper or report linked
  const paper = benchmarks
    .filter((b) => isPublic(b) && !b.links?.paper)
    .map((b) => bench('paper', b, 'No paper or report linked.', correction(b, 'paper', `${b.name} has no paper or report linked. It is: `), 'links.paper'));

  // 5. models with no release date
  const modelRelease = models
    .filter((m) => !m.released)
    .map((m): Task => {
      const page = input.modelPages.has(m.id) ? `${site}/models/${m.id}/` : `${site}/models/`;
      return {
        id: `model-release:${m.id}`,
        kind: 'model-release',
        name: m.name,
        page,
        detail: 'No release date.',
        action: form('correction.yml', { title: `Correction: release date of ${m.name}`, page, wrong: `${m.name} has no release date. It was released on YYYY-MM-DD.` }),
        file: 'data/models.json',
        field: 'released',
        rank: input.modelScores.get(m.id) ?? 0,
      };
    });

  // 6. finds the discovery job ranks worth cataloging, still waiting for review
  const ids = new Map<string, string[]>();
  for (const b of benchmarks) for (const n of [b.name, ...(b.aliases ?? [])]) ids.set(nameKey(n), [...(ids.get(nameKey(n)) ?? []), b.id]);
  const papers = new Set(benchmarks.map((b) => b.links?.paper?.match(/(\d{4}\.\d{4,5})/)?.[1]).filter(Boolean));
  const left = new Set(input.rejected.map(nameKey));
  const review = input.finds
    .filter((f) => f.decision === 'catalog' && !(f.arxiv && papers.has(f.arxiv)) && !(ids.get(nameKey(f.name)) ?? []).some((id) => id !== f.sameNameAs) && !left.has(nameKey(f.name)))
    .map(
      (f): Task => ({
        id: `review:${f.key}`,
        kind: 'review',
        name: f.name,
        page: `${site}/new/`,
        detail: f.title,
        action: form('benchmark.yml', {
          title: `Benchmark: ${f.name}`,
          name: f.name,
          paper: f.arxiv ? `https://arxiv.org/abs/${f.arxiv}` : f.url,
          ...(f.repo ? { code: f.repo } : {}),
          evidence: 'Links that show it passes one of the four tests: ',
        }),
        extra: { label: 'Source', url: f.url },
        file: 'data/benchmarks.json',
        rank: f.feeds.length,
      }),
    );

  // 7. write-ups that may criticize a cataloged benchmark, not yet logged as audits
  const nameOf = new Map(benchmarks.map((b) => [b.id, b.name]));
  const critique = input.audits
    .filter((a) => a.benchmarks.some((id) => nameOf.has(id)))
    .map((a): Task => {
      const names = a.benchmarks.map((id) => nameOf.get(id)).filter((n): n is string => !!n);
      return {
        id: `critique:${a.key}`,
        kind: 'critique',
        name: names.join(', '),
        page: `${site}/benchmarks/${a.benchmarks.find((id) => nameOf.has(id))}/`,
        detail: a.title,
        action: form('critique.yml', { title: `Critique: ${names[0]}`, benchmark: names.join(', '), sources: a.url, problem: 'What the write-up found: ' }),
        extra: { label: 'Write-up', url: a.url },
        file: 'data/audits.json',
        rank: 0,
      };
    });

  // 8. official leaderboards we link but don't read yet
  const importer = benchmarks
    .filter((b) => b.links?.leaderboard && !NO_IMPORT.test(b.links.leaderboard) && !read(b.id))
    .map((b) => ({
      ...bench('importer', b, nLabs(b.id) ? `${nLabs(b.id)} ${nLabs(b.id) === 1 ? 'lab reports' : 'labs report'} it. We link its leaderboard but don't read it.` : 'We link its leaderboard but don\'t read it.', GUIDE, undefined, { label: 'Leaderboard', url: b.links!.leaderboard! }),
      file: `scripts/leaderboards/${b.id}.ts`,
    }));

  // 9. importers whose last run failed
  const benchById = new Map(benchmarks.map((b) => [b.id, b]));
  const broken = [...brokenBoards(input.boards).entries()]
    .filter(([id]) => benchById.has(id))
    .map(([id, f]) => {
      const b = benchById.get(id)!;
      const file = `scripts/leaderboards/${id}.ts`;
      const since = `It has failed since ${f.date}${f.error ? `: ${f.error}` : ''}.`;
      return {
        ...bench('broken', b, since, form('bug.yml', { title: `Bug: the ${b.name} importer fails`, page: benchPage(b), what: `The importer ${file} fails. ${since}` }), undefined, { label: 'Importer', url: `${REPO}/blob/main/${file}` }),
        file,
      };
    });

  const n = (k: number, one: string, many: string) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;
  const groups: TaskGroup[] = [
    { kind: 'leaderboard', title: `${n(leaderboard.length, 'public benchmark two or more labs report has', 'public benchmarks two or more labs report have')} no leaderboard we know of`, how: 'If you know where one is ranked, send the link. If you made it, the maker form below lets us read your results directly.', verb: 'Send the link', code: false, tasks: leaderboard },
    { kind: 'release', title: `${n(release.length, 'benchmark has', 'benchmarks have')} no release date`, how: 'The month its paper, repository or launch post first appeared. Give the link you dated it from.', verb: 'Add the date', code: false, tasks: release },
    { kind: 'level', title: `${n(level.length, 'benchmark has', 'benchmarks have')} no difficulty level`, how: 'Who could solve its tasks, from most adults to researchers on open problems. The levels are explained on the About page.', verb: 'Suggest a level', code: false, tasks: level },
    { kind: 'paper', title: `${n(paper.length, 'public benchmark has', 'public benchmarks have')} no paper or report linked`, how: 'The paper, technical report or launch post that introduced it. Some have none, and that is worth knowing too.', verb: 'Add the paper', code: false, tasks: paper },
    { kind: 'model-release', title: `${n(modelRelease.length, 'model has', 'models have')} no release date`, how: 'The day its lab released it, from the launch post, model card or API changelog.', verb: 'Add the date', code: false, tasks: modelRelease },
    { kind: 'review', title: `${n(review.length, 'new benchmark waits', 'new benchmarks wait')} for review`, how: 'Our daily scan ranked these worth cataloging. A benchmark gets in when it passes one of four tests, so evidence that a lab reports it or a leaderboard runs it settles it.', verb: 'Send the evidence', code: false, tasks: review },
    { kind: 'critique', title: `${n(critique.length, 'write-up may criticize', 'write-ups may criticize')} a benchmark we catalog`, how: 'Our scan flagged these. If one documents a real problem, such as leaked answers or a broken grader, log it as a critique.', verb: 'Log the critique', code: false, tasks: critique },
    { kind: 'importer', title: `${n(importer.length, 'official leaderboard we link isn\'t', 'official leaderboards we link aren\'t')} read yet`, how: 'Each needs a short importer that reads the board\'s published data. Check the board\'s terms first. The guide explains how.', verb: 'Write the importer', code: true, tasks: importer },
    { kind: 'broken', title: `${n(broken.length, 'importer has', 'importers have')} stopped working`, how: 'The board keeps its last scores until the importer is fixed. Most breaks are a moved file or a changed page.', verb: 'Report it', code: true, tasks: broken },
  ];
  for (const g of groups) g.tasks.sort(byRank);
  return groups.filter((g) => g.tasks.length);
}

/** The page's headline: the gap that most needs outside help, as a finding. */
export function headline(groups: TaskGroup[]): string {
  const lb = groups.find((g) => g.kind === 'leaderboard');
  if (lb) return lb.title;
  const top = [...groups].sort((a, b) => b.tasks.length - a.tasks.length)[0];
  return top ? top.title : 'Nothing is waiting right now';
}

/** The issue a task becomes on GitHub. The hidden marker lets a rerun find it again. */
export function issueOf(t: Task, g: TaskGroup): { title: string; body: string; labels: string[] } {
  const marker = `<!-- almanac-task: ${t.id} -->`;
  const lines = [
    marker,
    `**${t.name}**: ${t.detail}`,
    '',
    `Page: ${t.page}`,
    ...(t.extra ? [`${t.extra.label}: ${t.extra.url}`] : []),
    '',
    '### How to help',
    '',
    g.how,
    '',
  ];
  if (g.code) {
    lines.push(`Open a pull request that ${g.kind === 'broken' ? 'fixes' : 'adds'} \`${t.file}\`. Start from the importer guide: ${GUIDE}`);
    lines.push('', 'Test it with `node scripts/sync-leaderboards.ts --only ' + t.id.split(':')[1] + ' --dry`.');
  } else {
    lines.push(
      `Either comment here with the value and a source, or open a pull request that sets \`${t.field ?? 'the record'}\` on the record with id \`${t.id.split(':').slice(1).join(':')}\` in \`${t.file}\`. Run \`npm run check\` before you push.`,
    );
  }
  return {
    title: `${g.verb}: ${t.name}`,
    body: lines.join('\n'),
    labels: ['good first issue', g.code ? 'importer' : 'data'],
  };
}
