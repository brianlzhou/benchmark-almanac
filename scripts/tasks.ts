// Prints the open tasks on the /contribute/ page as JSON lines, or keeps a few of them open as GitHub
// "good first issue" issues. The task list itself comes from src/lib/tasks.ts, so the page and this script
// always agree.
//
//   node scripts/tasks.ts                     every task, one JSON line each
//   node scripts/tasks.ts --kind release      one kind (leaderboard, release, level, paper, model-release,
//                                             review, critique, importer, broken)
//   node scripts/tasks.ts --issues 20 [--dry] keep up to 20 task issues open (needs GITHUB_TOKEN and
//                                             GITHUB_REPOSITORY, which Actions sets)
//
// Each issue carries a hidden marker with the task id. A rerun finds its issues by that marker: it never opens
// a second issue for a task, never reopens a closed one, and closes an open one whose gap has been filled.
import { dataPath, readJson } from './lib/util.ts';
import { openTasks, issueOf, type AuditFind, type Find, type Task, type TaskGroup } from '../src/lib/tasks.ts';
import type { Benchmark, Model } from '../src/lib/types.ts';

const SITE = process.env.SITE_URL || 'https://benchmarks.brianzhou.org';
const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : undefined;
};

type Doc = { lab: string; model?: string; results: { benchmark: string }[] };
type Rows = { rows: (string | number | null)[][] };
const benchmarks = readJson<Benchmark[]>(dataPath('benchmarks.json'));
const models = readJson<Model[]>(dataPath('models.json'));
const cards = readJson<Doc[]>(dataPath('cards.json'));
const docs = [...cards, ...readJson<Doc[]>(dataPath('system-cards.json'))];
const lb = readJson<Rows & { boards: Record<string, { retrieved?: string; failed?: { date: string; error: string } }> }>(dataPath('scores', 'leaderboards.json'));
const epoch = readJson<Rows & { eci: { model: string; eci: number | null }[] }>(dataPath('scores', 'epoch.json'));
const discovered = readJson<{ items: Find[] }>(dataPath('discovered.json'));
const reviewed = readJson<{ rejected: { name: string }[] }>(dataPath('reviewed.json'));
const audits = readJson<{ items: AuditFind[] }>(dataPath('discovered-audits.json'));
const levels = readJson<{ levels: { name: string }[] }>(dataPath('taxonomy.json')).levels.map((l) => l.name);

// which models have a page, the same rule as featuredModels in src/lib/data.ts
const scores = new Map<string, number>();
const benchesOf = new Map<string, Set<string>>();
const add = (model: string | undefined | null, bench: string) => {
  if (!model) return;
  scores.set(model, (scores.get(model) ?? 0) + 1);
  (benchesOf.get(model) ?? benchesOf.set(model, new Set()).get(model)!).add(bench);
};
for (const r of [...epoch.rows, ...lb.rows]) add(r[1] as string, r[0] as string);
for (const d of docs) for (const r of d.results) add(d.model, r.benchmark);
const eci = new Set(epoch.eci.filter((e) => e.eci !== null).map((e) => e.model));
const launched = new Set(cards.map((c) => c.model));
const modelPages = new Set(models.filter((m) => eci.has(m.id) || launched.has(m.id) || (benchesOf.get(m.id)?.size ?? 0) >= 3).map((m) => m.id));

const groups = openTasks({
  site: SITE,
  benchmarks,
  models,
  docs,
  boards: lb.boards,
  // independent runs from Epoch AI: its own (via 'epoch') and boards it copied ('board'). Collected claims don't count.
  epoch: new Set(epoch.rows.filter((r) => r[7] === undefined || r[7] === 'epoch' || r[7] === 'board').map((r) => r[0] as string)),
  modelPages,
  modelScores: scores,
  levels,
  finds: discovered.items,
  rejected: reviewed.rejected.map((r) => r.name),
  audits: audits.items,
});

const issues = arg('--issues');
if (issues === undefined) {
  const kind = arg('--kind');
  for (const g of groups) if (!kind || g.kind === kind) for (const t of g.tasks) console.log(JSON.stringify(t));
} else {
  await syncIssues(Number(issues));
}

// ---- good first issues ---------------------------------------------------------------------------

async function syncIssues(limit: number) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 100) throw new Error('--issues takes a number from 0 to 100');
  const dry = process.argv.includes('--dry');
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Set GITHUB_REPOSITORY to owner/name');
  if (!token && !dry) throw new Error('Set GITHUB_TOKEN, or pass --dry');
  const api = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init.body ? { 'content-type': 'application/json' } : {}) },
    });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
    return res.json();
  };

  // every issue this script made, open or closed, by task id (at most 20 pages of 100)
  const mine = new Map<string, { number: number; state: string; body: string }>();
  if (token) {
    for (let page = 1; page <= 20; page++) {
      const list = (await api(`/issues?state=all&labels=${encodeURIComponent('good first issue')}&per_page=100&page=${page}`)) as { number: number; state: string; body: string | null; pull_request?: unknown }[];
      for (const i of list) {
        const id = i.body?.match(/<!-- almanac-task: (\S+) -->/)?.[1];
        if (id && !i.pull_request) mine.set(id, { number: i.number, state: i.state, body: i.body ?? '' });
      }
      if (list.length < 100) break;
    }
  }

  // issues work for gaps one source can fill and for importers. Reviews and critiques have their own forms.
  const issueKinds = new Set(['leaderboard', 'release', 'level', 'paper', 'model-release', 'importer', 'broken']);
  const open = new Map<string, { t: Task; g: TaskGroup }>();
  for (const g of groups) if (issueKinds.has(g.kind)) for (const t of g.tasks) open.set(t.id, { t, g });

  const log = (s: string) => console.log(dry ? `would ${s}` : s);
  // 1. close open issues whose gap has been filled
  for (const [id, i] of mine) {
    if (i.state !== 'open' || open.has(id)) continue;
    log(`close #${i.number} (${id}): the gap is filled`);
    if (!dry) {
      await api(`/issues/${i.number}/comments`, { method: 'POST', body: JSON.stringify({ body: 'The data now has this, so this task is done. Thank you.' }) });
      await api(`/issues/${i.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) });
    }
  }
  // 2. refresh the bodies of open issues
  let openCount = 0;
  for (const [id, i] of mine) {
    const task = open.get(id);
    if (i.state !== 'open' || !task) continue;
    openCount++;
    const next = issueOf(task.t, task.g);
    if (next.body !== i.body) {
      log(`update #${i.number} (${id})`);
      if (!dry) await api(`/issues/${i.number}`, { method: 'PATCH', body: JSON.stringify({ title: next.title, body: next.body }) });
    }
  }
  // 3. open new ones up to the limit, taking the top task of each kind in turn so the issues stay varied
  const queues = groups.filter((g) => issueKinds.has(g.kind)).map((g) => g.tasks.filter((t) => !mine.has(t.id)));
  for (let round = 0; openCount < limit && queues.some((q) => round < q.length) && round < 1000; round++) {
    for (const q of queues) {
      if (openCount >= limit) break;
      const t = q[round];
      if (!t) continue;
      const next = issueOf(t, open.get(t.id)!.g);
      log(`open "${next.title}" (${t.id})`);
      if (!dry) await api('/issues', { method: 'POST', body: JSON.stringify(next) });
      openCount++;
    }
  }
  console.log(`${openCount} task issues open${dry ? ' after this run' : ''}.`);
}
