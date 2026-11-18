// The day we first saw each leaderboard score: data/scores/first-seen.json. The sync dates a score at its model's
// release, so a model a board tested months later looks as if it had that score all along. This ledger keeps the
// day a score first showed up on a board we already read, so the time machine (src/lib/as-of.ts) can place it there.
//
// A row is one board entry: benchmark, model id (or "~" and the board's own name for an unlisted entry), setting
// and harness. Only new posts count. These rows are not new posts and stay out of the ledger, so they keep their
// release date:
//   - every row we had on `since`, the first day the scores file was in git
//   - the rows of a board on the day we first read it: they came with the importer, not with a new post
//   - the rows of a model on the day it joined data/models.json: the board may have listed it long before
//   - a board whose entries mostly changed keys at once (a renamed harness, a parser change): the board's
//     rows didn't change, our reading of them did
// A listed row keeps its first day if it leaves a board and comes back. A row we had on `since` that leaves and
// comes back counts as new on its return.
//
// Run it after the leaderboard sync, before the commit. It compares the working copy of data/scores/leaderboards.json
// with the last committed one (git HEAD), and stamps today on the rows that are new. With no git history it only
// makes sure the file exists.
//
// usage: node scripts/first-seen.ts [--backfill] [--dry]
//   --backfill rebuilds the ledger from the git history of the scores file, then adds the working copy's new rows
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ROOT, dataPath, readJson, today } from './lib/util.ts';

type BoardRow = [string, string, string | null, string | null, ...unknown[]];
interface Scores {
  boards: Record<string, unknown>;
  rows: BoardRow[];
  others?: BoardRow[];
}
export interface Ledger {
  about: string;
  /** The first day the scores file was in git. Rows we had then may be older: they keep their release date. */
  since: string;
  updated: string;
  /** The day we first read each board that came after `since`. */
  boards: Record<string, string>;
  columns: string[];
  /** benchmark, entry (model id, or "~" and the board's name), setting, harness, first day seen */
  rows: [string, string, string | null, string | null, string][];
}

const OUT = dataPath('scores', 'first-seen.json');
const FILE = 'data/scores/leaderboards.json';
const ABOUT =
  'The day we first saw each leaderboard score that a board posted after we started reading it. Written by scripts/first-seen.ts after each sync. Rows we had on the `since` day, rows that came with a board on the day we first read it, and rows of a model on the day it joined the catalog are not listed: they keep their model release date.';
/** A board whose new keys outnumber half its rows (and at least this many) changed how we read it, not what it says. */
const MASS = 5;

export const rowKey = (benchmark: string, entry: string, setting: string | null | undefined, harness: string | null | undefined) =>
  `${benchmark}\t${entry}\t${setting ?? ''}\t${harness ?? ''}`;

const git = (...args: string[]) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 });

/** Every row's key and each board's row count in one version of the scores file. */
function keysOf(s: Scores) {
  const keys = new Set<string>();
  const perBoard = new Map<string, number>();
  for (const r of s.rows) keys.add(rowKey(r[0], r[1], r[2], r[3]));
  for (const r of s.others ?? []) keys.add(rowKey(r[0], `~${r[1]}`, r[2], r[3]));
  for (const k of keys) {
    const b = k.slice(0, k.indexOf('\t'));
    perBoard.set(b, (perBoard.get(b) ?? 0) + 1);
  }
  return { keys, perBoard, boards: new Set(Object.keys(s.boards)), models: new Set(s.rows.map((r) => r[1])) };
}
type Snapshot = ReturnType<typeof keysOf> & { catalog: Set<string> };

const snapshot = (scores: Scores, models: { id: string }[]): Snapshot => ({ ...keysOf(scores), catalog: new Set(models.map((m) => m.id)) });

/**
 * The rows new in `cur` against `prev`, as posts we can date: on a board we already read, for a model already in the
 * catalog, and not part of a board-wide change of keys. Also returns the boards read for the first time.
 */
export function newPosts(prev: Snapshot, cur: Snapshot, known: Set<string>) {
  const boards = [...cur.boards].filter((b) => !prev.boards.has(b));
  const byBoard = new Map<string, string[]>();
  for (const k of cur.keys) {
    if (prev.keys.has(k) || known.has(k)) continue;
    const [b, entry] = k.split('\t');
    if (!prev.boards.has(b)) continue;
    if (!entry.startsWith('~') && !prev.catalog.has(entry)) continue;
    (byBoard.get(b) ?? byBoard.set(b, []).get(b)!).push(k);
  }
  const rows: string[] = [];
  const mass: string[] = [];
  for (const [b, ks] of byBoard) {
    const before = prev.perBoard.get(b) ?? 0;
    if (ks.length >= MASS && ks.length > before / 2) mass.push(`${b} (${ks.length} of ${before})`);
    else rows.push(...ks);
  }
  return { rows, boards, mass };
}

function write(ledger: Ledger) {
  ledger.rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]) || (a[2] ?? '').localeCompare(b[2] ?? '') || (a[3] ?? '').localeCompare(b[3] ?? ''));
  const boards = Object.fromEntries(Object.entries(ledger.boards).sort(([a], [b]) => a.localeCompare(b)));
  const lines = ledger.rows.map((r) => `    ${JSON.stringify(r)}`).join(',\n');
  writeFileSync(
    OUT,
    `{\n  "about": ${JSON.stringify(ledger.about)},\n  "since": ${JSON.stringify(ledger.since)},\n  "updated": ${JSON.stringify(ledger.updated)},\n  "boards": ${JSON.stringify(boards)},\n  "columns": ${JSON.stringify(ledger.columns)},\n  "rows": [\n${lines}\n  ]\n}\n`,
  );
}

function add(ledger: Ledger, found: ReturnType<typeof newPosts>, day: string) {
  for (const b of found.boards) ledger.boards[b] ??= day;
  for (const k of found.rows) {
    const [b, entry, setting, harness] = k.split('\t');
    ledger.rows.push([b, entry, setting || null, harness || null, day]);
  }
}

const readCommitted = (rev: string, path: string) => JSON.parse(git('show', `${rev}:${path}`));

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dry = process.argv.includes('--dry');
  const working = snapshot(readJson<Scores>(dataPath('scores', 'leaderboards.json')), readJson(dataPath('models.json')));
  let ledger: Ledger;
  let head: Snapshot | null = null;
  try {
    head = snapshot(readCommitted('HEAD', FILE), readCommitted('HEAD', 'data/models.json'));
  } catch {
    console.log('No committed scores file to compare with: nothing to stamp.');
  }

  if (process.argv.includes('--backfill') || !existsSync(OUT)) {
    // oldest first: each version against the one before it, dated by its commit
    const commits = git('log', '--reverse', '--format=%H %cd', '--date=short', '--', FILE)
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => ({ sha: l.split(' ')[0], date: l.split(' ')[1] }));
    if (!commits.length) throw new Error(`${FILE} has no git history`);
    ledger = { about: ABOUT, since: commits[0].date, updated: commits[0].date, boards: {}, columns: ['benchmark', 'entry', 'setting', 'harness', 'first'], rows: [] };
    let prev = snapshot(readCommitted(commits[0].sha, FILE), readCommitted(commits[0].sha, 'data/models.json'));
    for (const c of commits.slice(1)) {
      const cur = snapshot(readCommitted(c.sha, FILE), readCommitted(c.sha, 'data/models.json'));
      const known = new Set(ledger.rows.map((r) => rowKey(r[0], r[1], r[2], r[3])));
      const found = newPosts(prev, cur, known);
      // the first day counts as `since`: everything seen that day may be older
      if (c.date > ledger.since) add(ledger, found, c.date);
      console.log(`  ${c.date} ${c.sha.slice(0, 7)}: ${found.rows.length} new posts, ${found.boards.length} new boards${found.mass.length ? `, skipped board-wide changes: ${found.mass.slice(0, 6).join(', ')}${found.mass.length > 6 ? ' ...' : ''}` : ''}`);
      ledger.updated = c.date;
      prev = cur;
    }
  } else {
    ledger = JSON.parse(readFileSync(OUT, 'utf8')) as Ledger;
  }

  // the working copy against the last commit: what today's sync added
  if (head) {
    const known = new Set(ledger.rows.map((r) => rowKey(r[0], r[1], r[2], r[3])));
    const found = newPosts(head, working, known);
    const day = today();
    if (day > ledger.since) add(ledger, found, day);
    console.log(`  ${day} working copy: ${found.rows.length} new posts, ${found.boards.length} new boards${found.mass.length ? `, skipped board-wide changes: ${found.mass.join(', ')}` : ''}`);
    if (found.rows.length || found.boards.length) ledger.updated = day;
  }
  if (dry) console.log(`Would write ${ledger.rows.length} rows and ${Object.keys(ledger.boards).length} boards.`);
  else {
    write(ledger);
    console.log(`Wrote ${ledger.rows.length} first-seen rows and ${Object.keys(ledger.boards).length} boards read since ${ledger.since}.`);
  }
}
