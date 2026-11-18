// Arena's text leaderboard as it stood on each day Arena published it: data/scores/arena-history.json, for the time
// machine. It reads only Arena's CC BY 4.0 Hugging Face dataset (lmarena-ai/leaderboard-dataset), whose `full`
// split keeps every published leaderboard, because Arena's terms forbid automated access to arena.ai.
//
// It keeps the style-controlled text arena (subset text_style_control, category overall), the default view on Arena's
// page and the one scripts/leaderboards/lmarena-elo.ts reads today, and the top TOP models of each published day,
// with Arena's rating and rank. Names map to data/models.json through the same resolver and aliases as the importer.
// The dataset's name stays on each row either way.
//
// The full split is one Parquet file of about 58 MB. A run skips the download when the dataset's last commit is the
// one the file already records.
//
// usage: node scripts/arena-history.ts [--force]
import { existsSync, writeFileSync } from 'node:fs';
import { parquetReadObjects } from 'hyparquet';
import { dataPath, fetchBytes, fetchJson, readJson, today } from './lib/util.ts';
import { makeResolver } from './lib/models.ts';
import { ARENA_ALIASES, splitName } from './leaderboards/lmarena-elo.ts';

const DATASET = 'lmarena-ai/leaderboard-dataset';
const SUBSET = 'text_style_control';
const CATEGORY = 'overall';
const TOP = 20;
const OUT = dataPath('scores', 'arena-history.json');

/** One published day: the top models by rating, as [dataset name, model id or null, lab id or null, rating, rank]. */
export type ArenaSnapshotRow = [string, string | null, string | null, number, number];
export interface ArenaHistory {
  source: string;
  url: string;
  license: string;
  retrieved: string;
  /** The dataset commit the file was read from. */
  commit: string;
  subset: string;
  category: string;
  columns: string[];
  snapshots: { date: string; rows: ArenaSnapshotRow[] }[];
}

// Arena's older raw ids that neither the importer's aliases nor the resolver place
const OLD_NAMES: Record<string, string> = {
  'gemini-1.5-pro-api-0514': 'gemini-1-5-pro-may-2024',
  'gemini-1.5-flash-api-0514': 'gemini-1-5-flash-may-2024',
  'gpt-4-1106-preview': 'gpt-4-turbo-nov-2023',
  'mistral-large-2407': 'mistral-large-2-jul-2024',
  'mistral-medium-2505': 'mistral-medium-3',
  'mistral-medium-2508': 'mistral-medium-3-1',
  'kimi-k2-0711-preview': 'kimi-k2-jul-2025',
  'kimi-k2-0905-preview': 'kimi-k2-sep-2025',
  'kimi-k2-thinking-turbo': 'kimi-k2-thinking',
  'ernie-5.0-0110': 'ernie-5-0',
  'grok-4.20-beta1': 'grok-4-20',
  'grok-4-fast-chat': 'grok-4-fast',
};
// a run setting Arena writes after the snapshot stamp ("claude-opus-4-20250514-thinking-16k") or a weight format
const SUFFIX = /-(thinking-\d+k|no-thinking|bf16|fp8)$/i;

interface Row {
  organization?: string;
  model_name: string;
  rating: number;
  rank?: number | bigint;
  category: string;
  leaderboard_publish_date: string | Date;
}

const day = (d: string | Date) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

const force = process.argv.includes('--force');
const old = existsSync(OUT) ? readJson<ArenaHistory>(OUT) : null;
const [last] = await fetchJson<{ id: string; date: string }[]>(`https://huggingface.co/api/datasets/${DATASET}/commits/main?limit=1`);
if (!force && old && last && old.commit === last.id) {
  console.log(`Arena dataset unchanged since ${old.retrieved} (${last.id.slice(0, 7)}), nothing to do.`);
  process.exit(0);
}

const file = await fetchBytes(`https://huggingface.co/datasets/${DATASET}/resolve/main/${SUBSET}/full-00000-of-00001.parquet`, {}, 3, 300_000);
const all = (await parquetReadObjects({ file, columns: ['model_name', 'organization', 'rating', 'rank', 'category', 'leaderboard_publish_date'] })) as Row[];
const byDay = new Map<string, Row[]>();
for (const r of all) {
  if (r.category !== CATEGORY || !r.model_name || !Number.isFinite(r.rating)) continue;
  const d = day(r.leaderboard_publish_date);
  (byDay.get(d) ?? byDay.set(d, []).get(d)!).push(r);
}

const resolve = makeResolver({ ...ARENA_ALIASES, ...OLD_NAMES });
const models = new Map(readJson<{ id: string; lab?: string }[]>(dataPath('models.json')).map((m) => [m.id, m]));
// Arena's organization column, for a lab mark on names we can't place: "Google" and "Alibaba" are lab aliases
const labKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const labByName = new Map<string, string>();
for (const l of readJson<{ id: string; name: string; aliases?: string[] }[]>(dataPath('labs.json'))) for (const n of [l.id, l.name, ...(l.aliases ?? [])]) labByName.set(labKey(n), l.id);
const unmatched = new Set<string>();
const snapshots = [...byDay.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([date, rows]) => ({
    date,
    rows: rows
      .sort((a, b) => b.rating - a.rating)
      .slice(0, TOP)
      .map((r): ArenaSnapshotRow => {
        const name = r.model_name.trim();
        const parts = splitName(name.replace(SUFFIX, ''), date);
        // a name with a harness is an agent system, not the bare model: it keeps its own name only
        const hit = parts.harness ? null : (resolve(name) ?? resolve(parts.model, parts.date));
        if (!hit) unmatched.add(name);
        const lab = (hit ? models.get(hit.id)?.lab : undefined) ?? labByName.get(labKey(r.organization ?? '')) ?? null;
        return [name, hit?.id ?? null, lab, Math.round(r.rating * 10) / 10, Number(r.rank ?? 0)];
      }),
  }));

const out: ArenaHistory = {
  source: 'Arena (formerly LMArena), text leaderboard with style control',
  url: `https://huggingface.co/datasets/${DATASET}`,
  license: 'CC BY 4.0',
  retrieved: today(),
  commit: last?.id ?? '',
  subset: SUBSET,
  category: CATEGORY,
  columns: ['name', 'model', 'lab', 'rating', 'rank'],
  snapshots,
};
// one published day a line, so a new day is a one-line change
const { snapshots: snaps, ...head } = out;
const top = JSON.stringify(head, null, 2).replace(/\n}$/, '');
writeFileSync(OUT, `${top},\n  "snapshots": [\n${snaps.map((x) => `    ${JSON.stringify(x)}`).join(',\n')}\n  ]\n}\n`);
const rows = snapshots.reduce((n, s) => n + s.rows.length, 0);
console.log(`Wrote ${snapshots.length} Arena snapshots (${snapshots[0]?.date} to ${snapshots.at(-1)?.date}), ${rows} rows, ${unmatched.size} names not in the model list.`);
if (unmatched.size) console.log(`  not matched: ${[...unmatched].slice(0, 30).join(' | ')}`);
