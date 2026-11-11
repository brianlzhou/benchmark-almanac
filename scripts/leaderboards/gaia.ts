// GAIA (2023 test): retain every public scored submission, including ensembles and unnamed models.
// model_family is self-reported. Ambiguous systems remain unlisted with their submission name.
// The score is exact-match accuracy over 301 questions, converted from a fraction to percent.
// Poll the dataset viewer at least 2.1 seconds apart. Preserve agent, submission index, and date.
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
  score_level1?: number;
  score_level2?: number;
  score_level3?: number;
}

type Page = { rows: { row: Row }[]; num_rows_total: number };

/** One page from the viewer API; on HTTP 429 or a server error it waits 20 s and tries again (4 tries). */
async function viewerPage(offset: number): Promise<Page> {
  for (let i = 0; ; i++) {
    try {
      return await fetchJson<Page>(ROWS(offset));
    } catch (e) {
      if (i >= 3 || (e as { fatal?: boolean }).fatal) throw e;
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
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
      const page = await viewerPage(offset);
      all.push(...page.rows.map((r) => r.row));
      if (!page.rows.length || all.length >= page.num_rows_total) break;
      await new Promise((r) => setTimeout(r, 2100)); // the viewer API rate-limits anonymous bursts
    }
    if (all.length < 100) throw new Error(`only ${all.length} GAIA test rows`);
    return all.flatMap((r, index) => {
      if (typeof r.score !== 'number' || !Number.isFinite(r.score)) return [];
      const family = r.model_family?.trim();
      const ambiguous = !family || !/[a-z]/i.test(family) || /[,;+&]|\band\b|\bmultiple\b|\bensemble\b/i.test(family);
      const metrics: Record<string, number> = {};
      for (const key of ['score_level1', 'score_level2', 'score_level3'] as const) {
        if (typeof r[key] === 'number' && Number.isFinite(r[key])) metrics[key] = r[key]! * 100;
      }
      return [{
        model: ambiguous ? `GAIA system ${index}: ${r.model?.trim() || family || 'unnamed'}` : family!,
        score: r.score * 100,
        harness: r.model?.trim() || undefined,
        setting: `public test submission ${index}${ambiguous && family ? '; models: ' + family : ''}`,
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date! : undefined,
        metrics,
      }];
    });
  },
};
export default board;
