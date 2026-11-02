// GAIA (Meta, Hugging Face and AutoGPT). The gaia-benchmark/leaderboard Space loads the public
// gaia-benchmark/results_public dataset (config "2023", split "test"), sorts submissions by score (a fraction
// of the 300 withheld test questions answered exactly, 0 to 1) and shows the top 100. The importer reads the
// same rows through the Hugging Face dataset viewer API and keeps the same top 100 (0 to 100). Each row is an
// agent ("Agent name") built on a "Model family". The model family is the model and the agent name is the
// harness, so a family that names several models ("Claude Sonnet 3.5, GPT-4o") stays unmatched. The
// submission date is the row date. Other importers read Hugging Face datasets through hfDatasetRows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const VIEWER = 'https://datasets-server.huggingface.co';

/** Every row of one split of a public Hugging Face dataset, read 100 at a time through the dataset viewer. */
export async function hfDatasetRows<T>(dataset: string, config: string, split: string): Promise<T[]> {
  const q = `dataset=${encodeURIComponent(dataset)}&config=${encodeURIComponent(config)}&split=${encodeURIComponent(split)}`;
  const out: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await fetchJson<{ rows: { row: T }[]; num_rows_total: number }>(`${VIEWER}/rows?${q}&offset=${offset}&length=100`);
    out.push(...page.rows.map((r) => r.row));
    if (!page.rows.length || offset + 100 >= page.num_rows_total) break;
  }
  return out;
}

export const hfViewerFeed = (dataset: string, config: string, split: string) =>
  `${VIEWER}/rows?dataset=${dataset}&config=${config}&split=${split}`;

interface Row {
  model: string;
  model_family?: string;
  score?: number;
  date?: string;
}

const board: Leaderboard = {
  benchmark: 'gaia',
  url: 'https://huggingface.co/spaces/gaia-benchmark/leaderboard',
  feed: `${hfViewerFeed('gaia-benchmark/results_public', '2023', 'test')} (score, top 100)`,
  terms: 'Public Hugging Face dataset gaia-benchmark/results_public, which the Apache-2.0 leaderboard Space reads; the dataset states no license.',
  aliases: {},
  async fetch() {
    const all = await hfDatasetRows<Row>('gaia-benchmark/results_public', '2023', 'test');
    const top = all.filter((r) => typeof r.score === 'number').sort((a, b) => b.score! - a.score!).slice(0, 100);
    const rows: LeaderboardRow[] = [];
    for (const r of top) {
      const family = r.model_family?.trim();
      if (!family) continue;
      rows.push({
        model: family,
        score: r.score! * 100,
        harness: r.model.trim() || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date : undefined,
      });
    }
    return rows;
  },
};
export default board;
