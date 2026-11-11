// Tests for the accept bot: run with `npm test`. Nothing here uses the network. The last test runs the bot on
// the real data/ in a temporary copy and runs scripts/check-data.ts on the result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './util.ts';
import { accept, findBenchmark, formOf, https, month, nameText, parseForm, PROBLEM_OF, prose, spliceResult, STATUS_OF, ticked, type Data, type Doc, type Issue } from './accept.ts';

const here = dirname(fileURLToPath(import.meta.url));
const body = (form: string) => readFileSync(join(here, 'fixtures', 'accept', `${form}.md`), 'utf8');
const issue = (form: string, label: string, title = ''): Issue => ({ number: 42, title, body: body(form), labels: [label, 'accepted'] });
const TODAY = '2026-11-11';

/** A small catalog. cards.json keeps Python's 67.0, as the real file does. */
function fixture(): Data {
  const cards: Doc[] = [
    {
      id: 'acme-gizmo-1-2026-01-01',
      lab: 'acme',
      model: 'gizmo-1',
      date: '2026-01-01',
      title: 'Introducing Gizmo 1',
      url: 'https://acme.ai/gizmo-1',
      results: [{ benchmark: 'alpha-bench', score: 67, unit: '%', as_written: 'AlphaBench' }],
    },
    { id: 'acme-gizmo-0-2025-01-01', lab: 'acme', model: 'gizmo-0', date: '2025-01-01', title: 'Gizmo 0', url: 'https://acme.ai/gizmo-0', results: [] },
  ];
  const cardsText = `${JSON.stringify(cards, null, 2)}\n`.replace('"score": 67,', '"score": 67.0,');
  return {
    benchmarks: [
      { id: 'alpha-bench', name: 'AlphaBench', aliases: ['Alpha Bench'], unit: '%', family: 'alpha', version: '1', released: '2025-01' },
      { id: 'mmlu-pro', name: 'MMLU-Pro', unit: '%' },
      { id: 'twin-one', name: 'Twin Eval' },
      { id: 'twin-two', name: 'Twin Eval' },
      { id: 'zeta-qa', name: 'ZetaQA', unit: '%', links: { site: 'https://old.zeta.example.org' } },
    ],
    models: [
      { id: 'gizmo-0', name: 'Gizmo 0' },
      { id: 'gizmo-1', name: 'Gizmo 1', aliases: ['Gizmo-1'] },
    ],
    labs: [{ id: 'acme', name: 'Acme AI' }],
    cards,
    cardsText,
    systemCards: [],
    systemCardsText: '[]\n',
    audits: [
      {
        id: 'old-lab-2025-01-01',
        title: 'Old audit',
        author: 'Old Lab',
        date: '2025-01-01',
        url: 'https://old.example.org/audit',
        source: 'write-up',
        findings: [{ benchmark: 'zeta-qa', problems: ['wrong-labels'], summary: 'Some labels are wrong.', status: 'open' }],
      },
    ],
    reviewed: { added: [{ id: 'zeta-qa', date: '2025-02-01', via: 'A survey.' }], rejected: [] },
  };
}

test('forms parse into labeled fields and ticked boxes', () => {
  const f = parseForm(body('benchmark'));
  assert.equal(f.get('Name'), 'Quill Bench');
  assert.equal(f.get('Anything else'), undefined);
  assert.deepEqual(ticked(f.get('Which tests does it pass?')), ['A major lab reports it', 'People use it']);
  assert.equal(formOf(['submission', 'needs-review'], 'Benchmark: Quill'), 'benchmark');
  assert.equal(formOf([], 'Critique: grader'), 'critique');
  assert.equal(formOf(['question'], 'Hello'), undefined);
});

test('values pass only in the allowed shapes', () => {
  assert.equal(https('see https://a.example.org/x).'), 'https://a.example.org/x');
  assert.equal(https('http://a.example.org'), undefined);
  assert.equal(https('javascript:alert(1)'), undefined);
  assert.equal(https('https://user:pw@a.example.org'), undefined);
  assert.equal(month('2026-3-14'), '2026-03');
  assert.equal(month('2024-13'), undefined);
  assert.equal(month('March 2024'), undefined);
  assert.equal(prose('One thing; another — and more'), 'One thing. Another, and more.');
  assert.equal(nameText('τ²-Bench (Telecom) v1.0'), 'τ²-Bench (Telecom) v1.0');
  assert.equal(nameText('Quill $(touch x) `id`'), undefined);
  assert.equal(nameText('<script>'), undefined);
  assert.equal(findBenchmark('Twin Eval', fixture()).record, undefined);
  assert.equal(findBenchmark('Twin Eval', fixture()).candidates.length, 2);
  assert.equal(findBenchmark('https://x.org/benchmarks/zeta-qa/', fixture()).record?.id, 'zeta-qa');
});

test('a benchmark submission becomes a new record, in name order, with its family', () => {
  const o = accept(issue('benchmark', 'submission', 'Benchmark: Quill Bench'), fixture(), TODAY);
  assert.equal(o.action, 'pr');
  const list = JSON.parse(o.files['data/benchmarks.json']) as Record<string, unknown>[];
  const rec = list.find((b) => b.id === 'quill-bench-2-0')!;
  assert.equal(rec.name, 'Quill Bench 2.0');
  assert.equal(rec.category, 'coding');
  assert.equal(rec.released, '2026-03');
  assert.equal(rec.unit, '%');
  assert.equal(rec.access, 'public+private-holdout');
  assert.equal(rec.family, 'alpha');
  assert.equal(rec.description, "Models fix bugs in 300 real repositories. A patch passes when the repository's own tests pass, about 40% of tasks need more than one file.");
  assert.deepEqual(rec.links, { paper: 'https://arxiv.org/abs/2601.01234', repo: 'https://github.com/quill/quill-bench', leaderboard: 'https://quill.example.org/leaderboard' });
  assert.deepEqual(rec.evidence, ['https://acme.ai/gizmo-1', 'https://quill.example.org/leaderboard']);
  assert.deepEqual(
    list.map((b) => b.id),
    ['alpha-bench', 'mmlu-pro', 'quill-bench-2-0', 'twin-one', 'twin-two', 'zeta-qa'],
  );
  assert.equal(list.find((b) => b.id === 'alpha-bench')!.successor, 'quill-bench-2-0');
  const reviewed = JSON.parse(o.files['data/reviewed.json']);
  assert.deepEqual(reviewed.added[0], { id: 'quill-bench-2-0', date: TODAY, via: 'Submitted through the benchmark form, issue #42.' });
  assert.ok(o.todo.some((t) => t.includes('data link')));
  assert.ok(o.todo.some((t) => t.includes('scores.json')));
});

test('a benchmark the almanac has gets a reply, not a pull request', () => {
  const i = issue('benchmark', 'submission');
  i.body = i.body.replace('Quill Bench', 'Alpha Bench').replace('### Version\n\n2.0', '### Version\n\n_No response_');
  const o = accept(i, fixture(), TODAY);
  assert.equal(o.action, 'comment');
  assert.match(o.comment!, /already has this benchmark/);
});

test('a critique becomes a new audit, newest first', () => {
  const o = accept(issue('critique', 'critique', 'Critique: ZetaQA grader rejects thousands separators'), fixture(), TODAY);
  assert.equal(o.action, 'pr');
  const audits = JSON.parse(o.files['data/audits.json']);
  assert.equal(audits[0].id, 'quill-lab-2026-10-02');
  assert.equal(audits[0].title, 'ZetaQA grader rejects thousands separators');
  assert.equal(audits[0].author, 'Quill Lab');
  assert.equal(audits[0].source, 'write-up');
  assert.deepEqual(audits[0].findings[0].problems, ['broken-grader', 'wrong-labels']);
  assert.equal(audits[0].findings[0].status, 'fixed-by-maker');
  assert.equal(audits[0].findings[0].summary, 'The grader rejects answers with thousands separators. About 9% of correct answers are scored wrong.');
  assert.deepEqual(audits[0].findings[0].fixes, [{ label: "The maker's fix", url: 'https://github.com/zeta/zeta-qa/pull/12' }]);
});

test('a critique of an unclear benchmark gets a reply', () => {
  const i = issue('critique', 'critique');
  i.body = i.body.replace('### Benchmark\n\nZetaQA', '### Benchmark\n\nTwin Eval');
  const o = accept(i, fixture(), TODAY);
  assert.equal(o.action, 'comment');
  assert.match(o.comment!, /twin-one/);
});

test("a maintainer's field lines change the record, and the feed waits for an importer", () => {
  const o = accept(issue('maintainer', 'maintainer'), fixture(), TODAY);
  assert.equal(o.action, 'pr');
  const rec = JSON.parse(o.files['data/benchmarks.json']).find((b: { id: string }) => b.id === 'zeta-qa');
  assert.deepEqual(rec.links, { site: 'https://old.zeta.example.org', leaderboard: 'https://zeta.example.org/board' });
  assert.equal(rec.org, 'Zeta Research Group');
  assert.equal(rec.released, undefined);
  assert.equal(rec.colour, undefined);
  assert.ok(o.todo.some((t) => t.includes('importer') && t.includes('results.json')));
  assert.ok(o.todo.some((t) => t.includes('2024-13')));
});

test('a launch-post score is spliced in without reformatting the file', () => {
  const data = fixture();
  const o = accept(issue('score', 'score'), data, TODAY);
  assert.equal(o.action, 'pr');
  const text = o.files['data/cards.json'];
  assert.ok(text.includes('"score": 67.0,'), 'the old row keeps its 67.0');
  const card = JSON.parse(text)[0];
  assert.deepEqual(card.results[1], { benchmark: 'mmlu-pro', score: 81.4, unit: '%', as_written: 'MMLU-Pro, max effort, 5-shot' });
  // a different number for a row the card has replaces it in place
  const again = structuredClone(data);
  again.cards[0].results.push({ benchmark: 'mmlu-pro', score: 80, unit: '%', as_written: 'MMLU-Pro' });
  again.cardsText = spliceResult(data.cardsText, data.cards, 'acme-gizmo-1-2026-01-01', { benchmark: 'mmlu-pro', score: 80, unit: '%', as_written: 'MMLU-Pro' });
  const fixed = accept(issue('score', 'score'), again, TODAY);
  assert.match(fixed.title!, /^Fix/);
  assert.equal(JSON.parse(fixed.files['data/cards.json'])[0].results[1].score, 81.4);
  assert.ok(fixed.files['data/cards.json'].includes('"score": 67.0,'));
});

test('a score with no matching launch post, or from a leaderboard, gets a reply', () => {
  const i = issue('score', 'score');
  i.body = i.body.replace('https://acme.ai/gizmo-1/', 'https://elsewhere.example.org/post');
  assert.equal(accept(i, fixture(), TODAY).action, 'comment');
  const board = issue('score', 'score');
  board.body = board.body.replace("The lab's launch post", "The benchmark's own leaderboard");
  assert.match(accept(board, fixture(), TODAY).comment!, /importers/);
});

test('a correction with a field line opens a draft, and one without gets a reply', () => {
  const o = accept(issue('correction', 'correction'), fixture(), TODAY);
  assert.equal(o.action, 'pr');
  assert.equal(o.draft, true);
  assert.equal(JSON.parse(o.files['data/benchmarks.json']).find((b: { id: string }) => b.id === 'zeta-qa').released, '2024-02');
  const i = issue('correction', 'correction');
  i.body = i.body.replace('released: 2024-02\nname: ZetaQA', 'It should be February 2024.');
  assert.equal(accept(i, fixture(), TODAY).action, 'comment');
});

test('bugs and ideas get a reply', () => {
  assert.equal(accept(issue('bug', 'bug'), fixture(), TODAY).action, 'comment');
  assert.equal(accept(issue('idea', 'idea'), fixture(), TODAY).action, 'comment');
});

test("the forms' labels and options match what the bot reads", () => {
  const form = (name: string) => readFileSync(join(ROOT, '.github', 'ISSUE_TEMPLATE', `${name}.yml`), 'utf8');
  const labels = (name: string) => [...form(name).matchAll(/^\s+label: (.+)$/gm)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
  const options = (name: string) => [...form(name).matchAll(/^\s+- (?:label: )?(.+)$/gm)].map((m) => m[1].replace(/^['"]|['"]$/g, ''));
  const read: Record<string, string[]> = {
    benchmark: ['Name', 'Version', 'What it tests', 'Area', 'Paper or report', 'Code', 'Data', 'Test set', 'License', 'Leaderboard', 'Scores file', 'Scoring', 'Released', 'Made by', 'Evidence', 'Replaces'],
    critique: ['Benchmark', 'Kind of problem', 'What the problem is', 'Sources', 'Numbers', 'Status', 'Fix'],
    maintainer: ['Benchmark', "What you'd like", 'Results file or API', 'Terms for reading it', 'Text changes'],
    score: ['Model', 'Benchmark', 'Score', 'Setting', 'Where it was published', 'Source'],
    correction: ['Page', 'What is wrong', 'Source'],
  };
  for (const [name, want] of Object.entries(read)) for (const l of want) assert.ok(labels(name).includes(l), `${name}.yml has the field "${l}"`);
  for (const o of options('critique').filter((x) => /^[A-Z][^.]+\. /.test(x) && !x.startsWith('Something else')))
    assert.ok(PROBLEM_OF[o.split('.')[0]], `critique box "${o}" maps to a problem kind`);
  for (const s of Object.keys(STATUS_OF)) assert.ok(options('critique').includes(s), `critique status "${s}" is a form option`);
  for (const a of ['Knowledge and language', 'Math and science', 'Coding', 'Agents and tools', 'Professional work', 'Vision, audio and robotics', 'Safety and security', 'Other'])
    assert.ok(options('benchmark').includes(a), `benchmark area "${a}" is a form option`);
});

test('on the real data, the bot makes changes that pass check-data', () => {
  const load = (f: string) => readFileSync(join(ROOT, 'data', f), 'utf8');
  const cardsText = load('cards.json');
  const data: Data = {
    benchmarks: JSON.parse(load('benchmarks.json')),
    models: JSON.parse(load('models.json')),
    labs: JSON.parse(load('labs.json')),
    cards: JSON.parse(cardsText),
    cardsText,
    systemCards: JSON.parse(load('system-cards.json')),
    systemCardsText: load('system-cards.json'),
    audits: JSON.parse(load('audits.json')),
    reviewed: JSON.parse(load('reviewed.json')),
  };
  // a launch post whose model resolves by name, and a benchmark it lacks
  const models = new Map(data.models.map((m) => [m.id, m]));
  const card = data.cards.find((c) => {
    const m = models.get(c.model);
    return m && !c.results.some((r) => r.benchmark === 'mmlu-pro') && data.models.filter((x) => x.name === m.name).length === 1 && data.cards.filter((d) => d.url === c.url).length === 1;
  })!;
  const score: Issue = {
    number: 7,
    title: 'Score: test',
    labels: ['score'],
    body: `### Model\n\n${models.get(card.model)!.name}\n\n### Benchmark\n\nMMLU-Pro\n\n### Score\n\n81.4%\n\n### Where it was published\n\nThe lab's launch post\n\n### Source\n\n${card.url}\n`,
  };
  const outcomes = [accept(issue('benchmark', 'submission'), data, TODAY), accept(score, data, TODAY)];
  for (const o of outcomes) assert.equal(o.action, 'pr', o.comment);
  // the score edit changes only the lines of the new row
  const before = cardsText.split('\n');
  const after = outcomes[1].files['data/cards.json'].split('\n');
  assert.ok(after.length - before.length <= 7 && after.length > before.length, `the score adds a few lines, not ${after.length - before.length}`);

  const dir = mkdtempSync(join(tmpdir(), 'accept-'));
  try {
    mkdirSync(join(dir, 'scripts', 'lib'), { recursive: true });
    copyFileSync(join(ROOT, 'scripts', 'check-data.ts'), join(dir, 'scripts', 'check-data.ts'));
    copyFileSync(join(ROOT, 'scripts', 'lib', 'util.ts'), join(dir, 'scripts', 'lib', 'util.ts'));
    mkdirSync(join(dir, 'data'));
    for (const f of readdirSync(join(ROOT, 'data'))) symlinkSync(join(ROOT, 'data', f), join(dir, 'data', f));
    for (const o of outcomes)
      for (const [path, text] of Object.entries(o.files)) {
        rmSync(join(dir, path));
        writeFileSync(join(dir, path), text);
      }
    const r = spawnSync(process.execPath, [join(dir, 'scripts', 'check-data.ts')], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
