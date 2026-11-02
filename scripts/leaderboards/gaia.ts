// GAIA (2023 set). The Hugging Face Space gaia-benchmark/leaderboard reads the public dataset
// gaia-benchmark/results_public (config 2023) and ranks the test split by "Average score (%)", the share of
// the 301 test questions answered exactly. The dataset files are Parquet, so this reads the test split
// through the Hugging Face dataset viewer API, 100 rows a request. Every row is an agent submission: "model"
// is the agent's name and "model_family" is free text naming the model or models behind it. Only rows whose
// model_family names one registry model are kept, with the agent name as the harness; rows that list
// several models or a bare family ("Claude", "GPT") do not resolve and are left out. The date is the
// submission date the dataset records.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const DATASET = 'gaia-benchmark/results_public';
const ROWS = (offset: number) =>
  `https://datasets-server.huggingface.co/rows?dataset=${DATASET}&config=2023&split=test&offset=${offset}&length=100`;

interface Row {
  model: string | null;
  model_family: string | null;
  score: number | null;
  date: string | null;
}

const board: Leaderboard = {
  benchmark: 'gaia',
  url: 'https://huggingface.co/spaces/gaia-benchmark/leaderboard',
  feed: `https://huggingface.co/datasets/${DATASET} (config 2023, split test, via the dataset viewer API)`,
  terms: 'Public, ungated Hugging Face dataset that the GAIA Space reads to draw its board; the dataset states no license, and Hugging Face terms allow reading it.',
  aliases: {
    // Gemini 3.1 Pro Preview spelled backwards; the resolver would place it on Gemini 1.0 Pro
    'gemini-pro-preview-3-1': 'gemini-3-1-pro',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const all: Row[] = [];
    for (let offset = 0; offset < 20_000; offset += 100) {
      const page = await fetchJson<{ rows: { row: Row }[]; num_rows_total: number }>(ROWS(offset));
      all.push(...page.rows.map((r) => r.row));
      if (!page.rows.length || all.length >= page.num_rows_total) break;
    }
    if (all.length < 100) throw new Error(`only ${all.length} GAIA test rows`);
    return all
      .filter((r) => r.model_family && /[a-z]/i.test(r.model_family) && typeof r.score === 'number')
      .map((r) => ({
        model: r.model_family!.trim(),
        score: r.score! * 100,
        harness: r.model?.trim() || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date! : undefined,
      }));
  },
};
export default board;
