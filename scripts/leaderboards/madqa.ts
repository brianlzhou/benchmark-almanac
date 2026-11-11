// MADQA (agents answering questions over 800 PDFs). The Snowflake/MADQA-Leaderboard Space builds its table
// from eval/reevaluated_results/<org>/*_results_<timestamp>.json, keeping the newest file per model_name
// and ranking by results.overall.semantic, "Accuracy (LLM judge)" (0 to 100); the importer does the same,
// listing the files through the Hub API. Model names carry the snapshot date and the retrieval setup
// ("GPT-5.2 (2025-12-11) with BM25 Search Tool"): the date is passed on and the setup becomes the harness.
// The human baselines are skipped. Each row also keeps the accuracy's 95% interval (semantic_ci as
// metrics.ciLow, ciHigh), the attribution F1 for pages and documents (metrics.pageF1, docF1) and, except for
// conventional RAG runs, the "Effort (Kuiper)" calibration statistic (metrics.kuiper, lower is better). The
// Space plots accuracy against page attribution F1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SPACE = 'Snowflake/MADQA-Leaderboard';
const LIST = `https://huggingface.co/api/spaces/${SPACE}`;
const FILE = (path: string) => `https://huggingface.co/spaces/${SPACE}/resolve/main/${path.split('/').map(encodeURIComponent).join('/')}`;

interface Result {
  model_name?: string;
  results?: { overall?: Overall } | string;
  tags?: string[];
}
interface Overall {
  semantic?: number;
  anls?: number;
  semantic_ci?: [number, number] | null;
  page_f1?: number;
  doc_f1?: number;
  kuiper?: number;
}

const board: Leaderboard = {
  benchmark: 'madqa',
  url: `https://huggingface.co/spaces/${SPACE}`,
  feed: `${LIST} (eval/reevaluated_results/*/*_results_*.json, newest per model)`,
  terms: 'Result files in the public MADQA leaderboard Space, which states no license; scores are cited to the MADQA authors.',
  aliases: {
    // the API's gemini-2.5-flash, the June 2025 GA model (runs from January 2026)
    'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
    'Qwen3-VL-235B-A22B': 'qwen3-vl-235b-a22b',
    'Qwen3-VL-8B': 'qwen3-vl-8b-thinking',
    'Qwen3-VL-32B': 'qwen3-vl-32b-thinking',
  },
  chart: {
    title: 'Accuracy vs Attribution',
    note: 'Each point is one submission: LLM-judged answer accuracy against how well it cites the right pages (page F1).',
    x: { key: 'pageF1', label: 'Attribution (Page F1)', unit: '%', better: 'higher' },
    y: { key: 'score', label: 'Accuracy (LLM judge)', unit: '%', better: 'higher' },
  },
  async fetch() {
    const { siblings } = await fetchJson<{ siblings: { rfilename: string }[] }>(LIST);
    const files = siblings
      .map((s) => s.rfilename)
      .filter((p) => /^eval\/reevaluated_results\/[^/]+\/[^/]+_results_\d{8}_\d{6}\.json$/.test(p) && !p.includes('/Humanity/'));
    const newest = new Map<string, { stamp: string; score: number; metrics: Record<string, number> }>();
    for (let i = 0; i < files.length; i += 8) {
      const batch = await Promise.all(
        files.slice(i, i + 8).map(async (p) => ({ p, d: await fetchJson<Result>(FILE(p)).catch(() => null) })),
      );
      for (const { p, d } of batch) {
        const name = d?.model_name?.trim();
        const res = typeof d?.results === 'string' ? JSON.parse(d.results) : d?.results;
        const o: Overall | undefined = res?.overall;
        const score = o?.semantic ?? o?.anls;
        const stamp = p.match(/_results_(\d{8}_\d{6})\.json$/)?.[1] ?? '';
        if (!name || typeof score !== 'number') continue;
        const metrics: Record<string, number> = {};
        if (o?.semantic !== undefined && Array.isArray(o.semantic_ci) && o.semantic_ci.every(Number.isFinite)) Object.assign(metrics, { ciLow: o.semantic_ci[0], ciHigh: o.semantic_ci[1] });
        if (typeof o?.page_f1 === 'number') metrics.pageF1 = o.page_f1;
        if (typeof o?.doc_f1 === 'number') metrics.docF1 = o.doc_f1;
        // the Space leaves conventional RAG out of its effort plot: Kuiper means nothing without agent steps
        if (typeof o?.kuiper === 'number' && o.kuiper > 0 && !d?.tags?.includes('Conventional RAG')) metrics.kuiper = o.kuiper;
        const prev = newest.get(name);
        if (!prev || stamp > prev.stamp) newest.set(name, { stamp, score, metrics });
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [name, { score, metrics }] of newest) {
      const m = name.match(/^(.*?)(?:\s*\((\d{4}-\d\d-\d\d)\))?(?:\s+with\s+(.+))?$/);
      let model = (m?.[1] ?? name).trim();
      const settings: string[] = [];
      // "Gemini 3 Pro (Preview)" is listed apart from a later "Gemini 3 Pro" run
      if (/\s*\(Preview\)$/i.test(model)) {
        model = model.replace(/\s*\(Preview\)$/i, '');
        settings.push('preview');
      }
      // "Qwen3-VL (235B-A22B-Thinking)": size and mode in brackets
      const qwen = model.match(/^(Qwen3-VL) \(([^()]+?)-Thinking\)$/);
      if (qwen) {
        model = `${qwen[1]}-${qwen[2]}`;
        settings.unshift('thinking');
      }
      rows.push({
        model,
        score,
        setting: settings.join(', ') || undefined,
        date: m?.[2],
        harness: m?.[3],
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
