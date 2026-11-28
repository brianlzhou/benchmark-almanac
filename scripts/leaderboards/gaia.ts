// GAIA (2023 test): retain every public scored submission, including ensembles and unnamed models.
// model_family is self-reported. Ambiguous systems remain unlisted with their submission name.
// The score is exact-match accuracy over 301 questions, converted from a fraction to percent.
// Read the published test file in submission order. Link to the submission when it has no external URL.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { parquetReadObjects } from 'hyparquet';
import { fetchBytes } from '../lib/util.ts';

const DATASET = 'gaia-benchmark/results_public';
const FILE = `https://huggingface.co/datasets/${DATASET}/resolve/main/2023/test-00000-of-00001.parquet`;

interface Row {
  model: string | null;
  /** the submitting organization, as the submitter typed it */
  organisation?: string | null;
  /** the submitter's link: code, a paper or a product page */
  url?: string | null;
  model_family: string | null;
  score: number | null;
  date: string | null;
  score_level1?: number;
  score_level2?: number;
  score_level3?: number;
}

const board: Leaderboard = {
  benchmark: 'gaia',
  parts: {
    score_level1: { name: 'Level 1', group: 'Difficulty' },
    score_level2: { name: 'Level 2', group: 'Difficulty' },
    score_level3: { name: 'Level 3', group: 'Difficulty' },
  },
  url: 'https://huggingface.co/spaces/gaia-benchmark/leaderboard',
  feed: FILE,
  terms: 'Public, ungated Hugging Face dataset that the GAIA Space reads to draw its board; the dataset states no license, and Hugging Face terms allow reading it.',
  // every submission is an agent its submitter named, built around the model in model_family
  harnesses: 'system',
  aliases: {
    // Gemini 3.1 Pro Preview spelled backwards; the resolver would place it on Gemini 1.0 Pro
    'gemini-pro-preview-3-1': 'gemini-3-1-pro',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const all = await parquetReadObjects({ file: await fetchBytes(FILE) }) as unknown as Row[];
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
        setting: `public test submission ${index}${ambiguous && family ? ', models: ' + family.replace(/\s*;\s*/g, ', ') : ''}`,
        date: /^\d{4}-\d\d-\d\d$/.test(r.date ?? '') ? r.date! : undefined,
        submitter: r.organisation?.trim() || undefined,
        link: /^https?:\/\/\S+$/.test(r.url?.trim() ?? '') ? r.url!.trim() : `https://huggingface.co/datasets/${DATASET}/viewer/2023/test?row=${index}`,
        metrics,
      }];
    });
  },
};
export default board;
