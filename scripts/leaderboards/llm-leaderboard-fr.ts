// Leaderboard LLM FR by French Government AI Coordination (fr-gouv-coordination-ia) via its Space JSON API.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://fr-gouv-coordination-ia-llm-leaderboard-fr.hf.space/api/leaderboard/formatted';
const URL = 'https://huggingface.co/spaces/fr-gouv-coordination-ia/llm_leaderboard_fr';

interface FrEvalMetric {
  name?: string;
  value?: number | null;
  normalized_score?: number | null;
}

interface FrEntry {
  id?: string;
  model?: {
    name?: string;
    precision?: string;
    average_score?: number | null;
  };
  evaluations?: {
    ifeval_fr?: FrEvalMetric;
    gpqa_fr?: FrEvalMetric;
    bac_fr?: FrEvalMetric;
  };
}

const board: Leaderboard = {
  benchmark: 'llm-leaderboard-fr',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. French Government AI Coordination publishes Leaderboard LLM FR results via its public Space API.',
  headline: 'Mean score across French IFEval, French GPQA, and French Baccalaureate (BAC FR) exams.',
  parts: {
    ifevalFr: 'IFEval FR',
    gpqaFr: 'GPQA FR',
    bacFr: 'BAC FR',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const entries = await fetchJson<FrEntry[]>(FEED);
    if (!Array.isArray(entries)) {
      throw new Error('Unexpected Leaderboard LLM FR payload: expected JSON array');
    }

    const rows: LeaderboardRow[] = [];
    for (const entry of entries) {
      const model = entry.model?.name?.trim();
      const score = entry.model?.average_score;
      if (!model || typeof score !== 'number' || !Number.isFinite(score)) continue;

      const precision = entry.model?.precision?.trim();
      const setting = precision && precision !== '?' ? precision : undefined;

      const metrics: Record<string, number> = {};
      const ifeval = entry.evaluations?.ifeval_fr?.value;
      const gpqa = entry.evaluations?.gpqa_fr?.value;
      const bac = entry.evaluations?.bac_fr?.value;
      if (typeof ifeval === 'number' && Number.isFinite(ifeval)) metrics.ifevalFr = Math.round(ifeval * 100) / 100;
      if (typeof gpqa === 'number' && Number.isFinite(gpqa)) metrics.gpqaFr = Math.round(gpqa * 100) / 100;
      if (typeof bac === 'number' && Number.isFinite(bac)) metrics.bacFr = Math.round(bac * 100) / 100;

      const link = /^[^/\s]+\/[^/\s]+$/.test(model) ? `https://huggingface.co/${model}` : undefined;

      rows.push({
        model,
        score: Math.round(score * 100) / 100,
        ...(setting ? { setting } : {}),
        ...(link ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 40) {
      throw new Error(`Expected at least 40 rows on Leaderboard LLM FR, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
