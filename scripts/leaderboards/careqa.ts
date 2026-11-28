// CareQA medical question answering benchmark from arXiv:2502.06666 HTML tables.
// Headline is CareQA close-ended English accuracy (%) from the Close-ended table (excluding other benchmarks
// like MedQA, MedMCQA, PubMedQA, and MMLU). Also reads CareQA Spanish accuracy and CareQA-Open metrics
// (perplexity, Prometheus judge, and automatic generation scores).
// Close-ended accuracy uncertainty (±) is standard error across questions, stored in `metrics.stderr`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2502.06666';

function parseVal(cell: string | undefined): { val?: number; err?: number } {
  if (!cell) return {};
  const parts = cell.split('±').map((s) => s.trim());
  const val = Number(parts[0]);
  const err = parts[1] !== undefined ? Number(parts[1]) : undefined;
  return {
    val: Number.isFinite(val) ? val : undefined,
    err: err !== undefined && Number.isFinite(err) ? err : undefined,
  };
}

const board: Leaderboard = {
  benchmark: 'careqa',
  static: 'paper',
  url: FEED,
  feed: FEED,
  terms: 'Paper and license at https://arxiv.org/abs/2502.06666',
  headline: 'CareQA close-ended English multiple-choice accuracy (%). CareQA Spanish accuracy and CareQA-Open metrics are stored separately.',
  parts: {
    es: { name: 'Spanish accuracy', unit: '%', better: 'higher' },
  },
  stats: {
    BitsperByte: { name: 'Bits per Byte', unit: 'score', better: 'lower' },
    BytePerplexity: { name: 'Byte Perplexity', unit: 'score', better: 'lower' },
    WordPerplexity: { name: 'Word Perplexity', unit: 'score', better: 'lower' },
    Prometheus: { name: 'Prometheus judge', unit: 'score', better: 'higher' },
    BERTScore: { name: 'BERTScore', unit: 'score', better: 'higher' },
    BLEU: { name: 'BLEU', unit: 'score', better: 'higher' },
    BLEURT: { name: 'BLEURT', unit: 'score', better: 'higher' },
    MoverScore: { name: 'MoverScore', unit: 'score', better: 'higher' },
    ROUGE1: { name: 'ROUGE-1', unit: 'score', better: 'higher' },
    ROUGE2: { name: 'ROUGE-2', unit: 'score', better: 'higher' },
    ROUGEL: { name: 'ROUGE-L', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);

    const tClose = tables.find(
      (t) => t[0]?.[0] === 'Model' && t[1]?.some((c) => /CareQA \(en\)/i.test(c)) && t[1]?.some((c) => /CareQA \(es\)/i.test(c)),
    );
    const tPerp = tables.find(
      (t) => t[0]?.[0] === 'Model' && t[1]?.some((c) => /CareQA\s*-?\s*Open/i.test(c)) && t[2]?.some((c) => /Bits per Byte/i.test(c)),
    );
    const tProm = tables.find(
      (t) => t[0]?.[0] === 'Model' && t[1]?.some((c) => /CareQA\s*-?\s*Open/i.test(c)) && t[2]?.some((c) => /Prometheus/i.test(c)),
    );
    const tAuto = tables.find(
      (t) => t[0]?.[0] === 'Model' && t[1]?.every((c, i) => i === 0 || /CareQA\s*-?\s*Open/i.test(c)) && t[2]?.some((c) => /BERTScore/i.test(c)),
    );

    if (!tClose) throw new Error('CareQA close-ended table missing from arXiv HTML');

    const enIdx = tClose[1].findIndex((c) => /CareQA \(en\)/i.test(c));
    const esIdx = tClose[1].findIndex((c) => /CareQA \(es\)/i.test(c));
    if (enIdx < 0 || esIdx < 0) throw new Error('CareQA (en) / (es) columns missing');

    const byModel = new Map<string, { score: number; metrics: Record<string, number> }>();

    for (const r of tClose.slice(2)) {
      const model = r[0]?.trim();
      if (!model || model === 'Model') continue;
      const en = parseVal(r[enIdx]);
      const es = parseVal(r[esIdx]);
      if (en.val === undefined) continue;

      const metrics: Record<string, number> = {};
      if (en.err !== undefined) metrics.stderr = Number((en.err * 100).toFixed(3));
      if (es.val !== undefined) metrics.es = Number((es.val * 100).toFixed(1));
      byModel.set(model, { score: Number((en.val * 100).toFixed(1)), metrics });
    }

    if (tPerp) {
      const bpbIdx = tPerp[1].findIndex((c) => /CareQA\s*-?\s*Open/i.test(c));
      if (bpbIdx >= 0) {
        for (const r of tPerp.slice(3)) {
          const entry = byModel.get(r[0]?.trim() ?? '');
          if (!entry) continue;
          const bpb = parseVal(r[bpbIdx]).val;
          const bp = parseVal(r[bpbIdx + 1]).val;
          const wp = parseVal(r[bpbIdx + 2]).val;
          if (bpb !== undefined) entry.metrics.BitsperByte = bpb;
          if (bp !== undefined) entry.metrics.BytePerplexity = bp;
          if (wp !== undefined) entry.metrics.WordPerplexity = Number(wp.toFixed(2));
        }
      }
    }

    if (tProm) {
      const pIdx = tProm[1].findIndex((c) => /CareQA\s*-?\s*Open/i.test(c));
      if (pIdx >= 0) {
        for (const r of tProm.slice(3)) {
          const entry = byModel.get(r[0]?.trim() ?? '');
          if (!entry) continue;
          const p = parseVal(r[pIdx]).val;
          if (p !== undefined) entry.metrics.Prometheus = p;
        }
      }
    }

    if (tAuto) {
      const keys = ['BERTScore', 'BLEU', 'BLEURT', 'MoverScore', 'ROUGE1', 'ROUGE2', 'ROUGEL'] as const;
      for (const r of tAuto.slice(3)) {
        const entry = byModel.get(r[0]?.trim() ?? '');
        if (!entry) continue;
        keys.forEach((k, i) => {
          const v = parseVal(r[i + 1]).val;
          if (v !== undefined) entry.metrics[k] = v;
        });
      }
    }

    const rows: LeaderboardRow[] = [...byModel].map(([model, entry]) => ({
      model,
      score: entry.score,
      metrics: entry.metrics,
    }));

    return checked(rows, 12);
  },
};

export default board;
