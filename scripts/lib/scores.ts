// The leaderboard store, kept in several files. data/scores/leaderboards.json holds the day of the last sync, each
// board's facts and the column names. data/scores/rows/<c>.json holds the rows and unlisted entries of every board
// whose id starts with the character c. GitHub refuses any file over 100 MB, and the store in one file passed that on
// 2026-11-21, so the daily sync couldn't push its scores. Readers get the whole store back in one object, with the
// same shape the single file had.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataPath } from './util.ts';

export const STORE_FILE = 'data/scores/leaderboards.json';
export const ROWS_DIR = 'data/scores/rows';

type Row = [string, string, ...unknown[]];
export interface Store {
  retrieved: string | null;
  boards: Record<string, any>;
  columns: string[];
  rows: Row[];
  otherColumns?: string[];
  others?: Row[];
}

/** The rows file a board's entries live in: the first character of its id. */
export function shardOf(benchmark: string): string {
  const c = benchmark.charAt(0).toLowerCase();
  return /[a-z0-9]/.test(c) ? c : '_';
}

/** The whole store from the index file's text and each rows file's text. An index from before the split holds its rows. */
export function parseScores(index: string, shards: string[]): Store {
  const store = JSON.parse(index) as Store;
  if (Array.isArray(store.rows)) return store;
  store.rows = [];
  store.others = [];
  for (const text of shards) {
    const s = JSON.parse(text) as { rows?: Row[]; others?: Row[] };
    for (const r of s.rows ?? []) store.rows.push(r);
    for (const r of s.others ?? []) store.others.push(r);
  }
  return store;
}

/** The working copy of the store. */
export function readScores(): Store {
  const dir = dataPath('scores', 'rows');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  return parseScores(readFileSync(dataPath('scores', 'leaderboards.json'), 'utf8'), files.map((f) => readFileSync(join(dir, f), 'utf8')));
}

/** The store as one git revision has it. `git` runs a git command and returns its output. */
export function readScoresAt(rev: string, git: (...args: string[]) => string): Store {
  const index = git('show', `${rev}:${STORE_FILE}`);
  if (Array.isArray(JSON.parse(index).rows)) return parseScores(index, []);
  const files = git('ls-tree', '--name-only', `${rev}:${ROWS_DIR}`).split('\n').filter((f) => f.endsWith('.json')).sort();
  return parseScores(index, files.map((f) => git('show', `${rev}:${ROWS_DIR}/${f}`)));
}

/** Write the store: the index, then one rows file per first character, one entry per line. Rows files left empty go. */
export function writeScores(store: Store) {
  const { rows, others = [], ...index } = store;
  const shards = new Map<string, { rows: Row[]; others: Row[] }>();
  const of = (id: string) => {
    const c = shardOf(id);
    if (!shards.has(c)) shards.set(c, { rows: [], others: [] });
    return shards.get(c)!;
  };
  for (const r of rows) of(r[0]).rows.push(r);
  for (const r of others) of(r[0]).others.push(r);
  const dir = dataPath('scores', 'rows');
  mkdirSync(dir, { recursive: true });
  const lines = (rs: Row[]) => (rs.length ? `\n${rs.map((r) => `    ${JSON.stringify(r)}`).join(',\n')}\n  ` : '');
  for (const [c, s] of shards) writeFileSync(join(dir, `${c}.json`), `{\n  "rows": [${lines(s.rows)}],\n  "others": [${lines(s.others)}]\n}\n`);
  for (const f of readdirSync(dir)) if (f.endsWith('.json') && !shards.has(f.slice(0, -5))) rmSync(join(dir, f));
  writeFileSync(
    dataPath('scores', 'leaderboards.json'),
    `{\n  "retrieved": ${JSON.stringify(index.retrieved)},\n  "rowsIn": "${ROWS_DIR}/<first character of the board id>.json",\n  "boards": ${JSON.stringify(index.boards, null, 2).replace(/\n/g, '\n  ')},\n  "columns": ${JSON.stringify(index.columns)},\n  "otherColumns": ${JSON.stringify(index.otherColumns ?? [])}\n}\n`,
  );
}
