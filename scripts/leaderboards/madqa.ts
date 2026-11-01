// MADQA (agents answering questions over 800 PDFs). The Snowflake/MADQA-Leaderboard Space builds its table
// from eval/reevaluated_results/<org>/*_results_<timestamp>.json, keeping the newest file per model_name
// and ranking by results.overall.semantic, "Accuracy (LLM judge)" (0 to 100); the importer does the same,
// listing the files through the Hub API. Model names carry the snapshot date and the retrieval setup
// ("GPT-5.2 (2025-12-11) with BM25 Search Tool"): the date is passed on and the setup becomes the harness.
// The human baselines are skipped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SPACE = 'Snowflake/MADQA-Leaderboard';
const LIST = `https://huggingface.co/api/spaces/${SPACE}`;
const FILE = (path: string) => `https://huggingface.co/spaces/${SPACE}/resolve/main/${path.split('/').map(encodeURIComponent).join('/')}`;

interface Result {
  model_name?: string;
  results?: { overall?: { semantic?: number; anls?: number } } | string;
}

const board: Leaderboard = {
  benchmark: 'madqa',
  url: `https://huggingface.co/spaces/${SPACE}`,
  feed: `${LIST} (eval/reevaluated_results/*/*_results_*.json, newest per model)`,
  terms: 'Result files in the public MADQA leaderboard Space, which states no licence; scores are cited to the MADQA authors.',
  aliases: {},
  async fetch() {
    const { siblings } = await fetchJson<{ siblings: { rfilename: string }[] }>(LIST);
    const files = siblings
      .map((s) => s.rfilename)
      .filter((p) => /^eval\/reevaluated_results\/[^/]+\/[^/]+_results_\d{8}_\d{6}\.json$/.test(p) && !p.includes('/Humanity/'));
    const newest = new Map<string, { stamp: string; score: number }>();
    for (let i = 0; i < files.length; i += 8) {
      const batch = await Promise.all(
        files.slice(i, i + 8).map(async (p) => ({ p, d: await fetchJson<Result>(FILE(p)).catch(() => null) })),
      );
      for (const { p, d } of batch) {
        const name = d?.model_name?.trim();
        const res = typeof d?.results === 'string' ? JSON.parse(d.results) : d?.results;
        const score = res?.overall?.semantic ?? res?.overall?.anls;
        const stamp = p.match(/_results_(\d{8}_\d{6})\.json$/)?.[1] ?? '';
        if (!name || typeof score !== 'number') continue;
        const prev = newest.get(name);
        if (!prev || stamp > prev.stamp) newest.set(name, { stamp, score });
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [name, { score }] of newest) {
      const m = name.match(/^(.*?)(?:\s*\((\d{4}-\d\d-\d\d)\))?(?:\s+with\s+(.+))?$/);
      const model = (m?.[1] ?? name).replace(/\s*\(Preview\)$/i, '').trim();
      rows.push({ model, score, date: m?.[2], harness: m?.[3] });
    }
    return rows;
  },
};
export default board;
