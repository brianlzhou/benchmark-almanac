// Arena (formerly LMArena) text leaderboard, read only through Arena's Hugging Face dataset
// lmarena-ai/leaderboard-dataset. The page's default view is style-controlled, so this reads the
// text_style_control subset, "latest" split, category "overall", through the Hugging Face dataset
// viewer's documented /filter API (the files themselves are Parquet). The other Arena importers reuse arenaRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATASET = 'lmarena-ai/leaderboard-dataset';
export const ARENA_TERMS = 'Hugging Face dataset lmarena-ai/leaderboard-dataset, CC BY 4.0.';
export const arenaFeed = (config: string) =>
  `https://huggingface.co/datasets/${DATASET} (subset ${config}, split latest, category overall)`;

interface ArenaRow {
  model_name: string;
  rating: number;
  category: string;
  leaderboard_publish_date?: string;
}

/**
 * Arena writes snapshots, harnesses and weight formats in a trailing parenthesis:
 * "GPT-4o (2024-05-13)", "Claude Opus 4.5 (20251101)", "GPT-5.5 (Codex Harness)", "Llama 3.1 405B Instruct (FP8)".
 * A full snapshot date becomes the row date, so the resolver picks that snapshot.
 */
function splitName(name: string, published?: string): { model: string; date?: string; setting?: string; harness?: string } {
  const paren = name.match(/\s*\(([^()]*)\)$/);
  if (!paren) return { model: name, date: published };
  const inner = paren[1].trim();
  const base = name.slice(0, paren.index).trim();
  const day = inner.match(/^(20\d\d)-?(\d\d)-?(\d\d)$/);
  if (day) return { model: base, date: `${day[1]}-${day[2]}-${day[3]}` };
  const harness = inner.match(/^(.+?)\s+Harness$/i);
  if (harness) return { model: base, harness: harness[1], date: published };
  if (/^(BF16|FP8|FP16|NVFP4|INT4|INT8|Instant)$/i.test(inner)) return { model: base, setting: inner.toLowerCase(), date: published };
  return { model: name, date: published };
}

/** Every "overall" row of one subset's latest published leaderboard; the rating is the Arena score. */
export async function arenaRows(config: string): Promise<LeaderboardRow[]> {
  const rows: LeaderboardRow[] = [];
  for (let offset = 0; ; offset += 100) {
    const q = new URLSearchParams({
      dataset: DATASET,
      config,
      split: 'latest',
      where: `"category"='overall'`,
      offset: String(offset),
      length: '100',
    });
    const page = await fetchJson<{ rows: { row: ArenaRow }[]; num_rows_total: number }>(
      `https://datasets-server.huggingface.co/filter?${q}`,
    );
    for (const { row } of page.rows) {
      if (!row.model_name || !Number.isFinite(row.rating)) continue;
      rows.push({ ...splitName(row.model_name.trim(), row.leaderboard_publish_date), score: row.rating });
    }
    if (!page.rows.length || offset + 100 >= page.num_rows_total) break;
  }
  if (!rows.length) throw new Error(`no overall rows in ${config}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'lmarena-elo',
  url: 'https://arena.ai/leaderboard/text',
  feed: arenaFeed('text_style_control'),
  terms: ARENA_TERMS,
  aliases: {},
  fetch: () => arenaRows('text_style_control'),
};
export default board;
