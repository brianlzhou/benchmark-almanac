// Turns an accepted issue into a pull request. When a maintainer adds the "accepted" label to an issue opened
// from one of the forms in .github/ISSUE_TEMPLATE/, .github/workflows/accept.yml runs this. It reads the issue,
// edits data/ (the decisions are in scripts/lib/accept.ts), runs the data checks, and opens or updates a pull
// request from the branch accept/<issue number>. When the form can't become a data change, or the checks fail,
// it replies on the issue instead.
//
// usage:
//   node scripts/accept.ts --event <dir>
//     In the workflow: reads the issue from $GITHUB_EVENT_PATH, writes outcome.json, pr-body.md and
//     comment.md to <dir>, then commits, pushes and opens the pull request with git and the GitHub CLI.
//   node scripts/accept.ts --dry <issue.json> [--write]
//     On your computer: prints what the bot would change for an issue ({number, title, body, labels}).
//     --write also edits data/ and runs the checks, without git.
//
// The issue text is untrusted. It reaches git and gh only as single arguments, never through a shell.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, dataPath, readJson, today } from './lib/util.ts';
import { accept, prBody, type Data, type Issue, type Outcome } from './lib/accept.ts';

function loadData(): Data {
  const cardsText = readFileSync(dataPath('cards.json'), 'utf8');
  const systemCardsText = readFileSync(dataPath('system-cards.json'), 'utf8');
  return {
    benchmarks: readJson(dataPath('benchmarks.json')),
    models: readJson(dataPath('models.json')),
    labs: readJson(dataPath('labs.json')),
    cards: JSON.parse(cardsText),
    cardsText,
    systemCards: JSON.parse(systemCardsText),
    systemCardsText,
    audits: readJson(dataPath('audits.json')),
    reviewed: readJson(dataPath('reviewed.json')),
  };
}

/** Writes the outcome's files into the repository and runs the data checks. */
function writeAndCheck(o: Outcome): { ok: boolean; output: string } {
  for (const [path, text] of Object.entries(o.files)) {
    if (!/^data\/[a-z-]+\.json$/.test(path)) throw new Error(`refusing to write ${path}`);
    writeFileSync(join(ROOT, path), text);
  }
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'check-data.ts')], { cwd: ROOT, encoding: 'utf8' });
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`
    .split('\n')
    .filter((l) => !/ExperimentalWarning|--trace-warnings/.test(l))
    .join('\n')
    .trim();
  return { ok: r.status === 0, output };
}

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' }).trim();

function readIssue(raw: { number: number; title?: string | null; body?: string | null; labels?: ({ name?: string } | string)[]; html_url?: string }): Issue {
  if (!Number.isInteger(raw.number) || raw.number < 1) throw new Error('the issue has no number');
  return {
    number: raw.number,
    title: String(raw.title ?? '').slice(0, 300),
    body: String(raw.body ?? '').slice(0, 65536),
    labels: (raw.labels ?? []).map((l) => (typeof l === 'string' ? l : (l.name ?? ''))).filter(Boolean),
    url: raw.html_url,
  };
}

/** A pull request title from the outcome: one line, at most 120 characters. */
const titleOf = (o: Outcome) => (o.title ?? 'Data change').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

const mode = process.argv[2];
if (mode === '--event') {
  const dir = process.argv[3];
  if (!dir) throw new Error('usage: node scripts/accept.ts --event <dir>');
  mkdirSync(dir, { recursive: true });
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH!, 'utf8')) as { issue: Parameters<typeof readIssue>[0]; repository: { default_branch: string } };
  const issue = readIssue(event.issue);
  const base = event.repository.default_branch;
  if (!/^[\w.\-/]{1,100}$/.test(base)) throw new Error('odd default branch name');
  const n = String(issue.number);
  const reply = (text: string) => {
    writeFileSync(join(dir, 'comment.md'), text);
    run('gh', ['issue', 'comment', n, '--body-file', join(dir, 'comment.md')]);
  };

  let o: Outcome;
  try {
    o = accept(issue, loadData(), today());
  } catch (e) {
    o = { kind: 'unknown', action: 'comment', changes: [], todo: [], files: {}, comment: `The bot hit an error and opened no pull request: ${String((e as Error).message).slice(0, 300)}. A maintainer will handle this by hand.` };
  }
  writeFileSync(join(dir, 'outcome.json'), JSON.stringify({ kind: o.kind, action: o.action, draft: !!o.draft, title: titleOf(o), changes: o.changes, todo: o.todo, files: Object.keys(o.files) }, null, 2));

  if (o.action === 'comment') {
    reply(`${o.comment}\n`);
  } else {
    const check = writeAndCheck(o);
    if (!check.ok) {
      run('git', ['checkout', '--', ...Object.keys(o.files)]);
      reply(`The bot made the change, but the data checks failed, so it opened no pull request. A maintainer will fix it by hand.\n\n\`\`\`\n${check.output.slice(0, 2000)}\n\`\`\`\n`);
    } else {
      try {
        openPr(o, check.output);
      } catch (e) {
        reply('The data checks passed, but the bot could not open the pull request. A maintainer will look at the workflow run.\n');
        throw e;
      }
    }
  }

  function openPr(o: Outcome, checkOutput: string) {
    const branch = `accept/${n}`;
    writeFileSync(join(dir, 'pr-body.md'), prBody(issue, o, checkOutput));
    const who = ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];
    run('git', ['checkout', '-B', branch]);
    run('git', ['add', '--', ...Object.keys(o.files)]);
    run('git', [...who, 'commit', '-m', titleOf(o), '-m', `From #${n}, accepted by a maintainer.`]);
    run('git', ['push', '--force', 'origin', `HEAD:refs/heads/${branch}`]);
    const open = run('gh', ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'url', '--jq', '.[0].url // ""']);
    let url = open;
    if (open) run('gh', ['pr', 'edit', open, '--title', titleOf(o), '--body-file', join(dir, 'pr-body.md')]);
    else url = run('gh', ['pr', 'create', '--head', branch, '--base', base, '--title', titleOf(o), '--body-file', join(dir, 'pr-body.md'), ...(o.draft ? ['--draft'] : [])]);
    reply(
      `A maintainer accepted this, so the bot ${open ? 'updated' : 'opened'} a pull request with the change: ${url}\n\nThe data checks passed. A maintainer reviews the pull request before it merges${o.draft ? ', and it starts as a draft because the bot read the values from free text' : ''}.\n`,
    );
  }
} else if (mode === '--dry') {
  const file = process.argv[3];
  if (!file) throw new Error('usage: node scripts/accept.ts --dry <issue.json> [--write]');
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const issue = readIssue(raw.issue ?? raw);
  const o = accept(issue, loadData(), today());
  console.log(JSON.stringify({ kind: o.kind, action: o.action, draft: !!o.draft, title: o.title, changes: o.changes, todo: o.todo, files: Object.keys(o.files), comment: o.comment }, null, 2));
  if (process.argv.includes('--write') && o.action === 'pr') {
    const check = writeAndCheck(o);
    console.log(check.ok ? `checks passed: ${check.output}` : `checks failed:\n${check.output}`);
  }
} else {
  console.error('usage: node scripts/accept.ts --event <dir> | --dry <issue.json> [--write]');
  process.exit(1);
}
