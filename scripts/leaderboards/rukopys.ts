// RUKOPYS Leaderboard (Ukrainian Catholic University): Ukrainian handwritten document OCR across
// archival, dictation, school, and university pages. Reads the live leaderboard.csv dataset,
// keeping composite score (0 to 1), 4 source domain parts, detection F1, class accuracy, region/page
// CER, cost per 1,000 pages, unparsed pages, eval date, open-weight flag, and parameter count.
// Excludes rows flagged trained_on_test === 'confirmed' ("score not comparable" per the board).
import { fetchText, parseCsv } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED =
  'https://huggingface.co/datasets/UkrainianCatholicUniversity/rukopys-leaderboard-results/raw/main/leaderboard.csv';

const num = (v: string | undefined): number | undefined => {
  if (!v) return undefined;
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

function parseParamsB(size: string | undefined): number | undefined {
  if (!size) return undefined;
  const m = size.trim().match(/^E?(\d+(?:\.\d+)?)B/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'rukopys',
  url: 'https://huggingface.co/spaces/UkrainianCatholicUniversity/rukopys-leaderboard',
  feed: FEED,
  terms: 'Public research benchmark dataset published by Ukrainian Catholic University on Hugging Face.',
  chart: {
    title: 'Quality versus cost per 1,000 pages',
    x: { key: 'usdPer1kPages', label: 'Cost per 1,000 pages', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Composite', unit: 'score', better: 'higher' },
    note: 'Matches the Quality vs cost Chart.js Pareto plot on the RUKOPYS leaderboard (API models at every reasoning level).',
  },
  parts: {
    archive: { name: 'Archive', unit: 'score', better: 'higher' },
    dictation: { name: 'Dictation', unit: 'score', better: 'higher' },
    school: { name: 'School', unit: 'score', better: 'higher' },
    university: { name: 'University', unit: 'score', better: 'higher' },
  },
  stats: {
    detF1: { name: 'Detection F1', unit: 'score', better: 'higher', note: 'Region detection F1 score on a 0 to 1 scale.' },
    classAcc: { name: 'Class accuracy', unit: 'score', better: 'higher', note: 'Region classification accuracy on a 0 to 1 scale.' },
    regionCer: { name: 'Region CER', unit: 'score', better: 'lower', note: 'Character error rate on detected text regions.' },
    pageCer: { name: 'Page CER', unit: 'score', better: 'lower', note: 'Full-page character error rate.' },
    usdPer1kPages: { name: 'Cost per 1,000 pages', unit: 'usd', better: 'lower', note: 'Estimated API spend in US dollars per 1,000 handwritten pages.' },
    unparsedPages: { name: 'Unparsed pages', unit: 'count', better: 'lower', note: 'Pages without a usable answer after one retry.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const csv = await fetchText(FEED);
    const records = parseCsv(csv);
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      if ((r['trained_on_test'] ?? '').trim().toLowerCase() === 'confirmed') continue;
      const model = (r['display_name'] ?? '').trim();
      const score = num(r['composite']);
      if (!model || score === undefined) continue;

      const runId = (r['run_id'] ?? '').trim();
      const reasoning = (r['reasoning'] ?? '').trim();
      const extraTag = runId.includes('__560tok__') ? '560tok' : undefined;
      const settingParts = [reasoning, extraTag].filter(Boolean);
      const setting = settingParts.length ? settingParts.join(', ') : undefined;

      const type = (r['type'] ?? '').trim();
      const open = type === 'open_weights' ? true : type === 'api' ? false : undefined;
      const params = parseParamsB(r['size']);
      const dateRaw = (r['date'] ?? '').trim();
      const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : undefined;

      const metrics: Record<string, number> = {};
      for (const [col, k] of [
        ['archive', 'archive'],
        ['dictation', 'dictation'],
        ['school', 'school'],
        ['university', 'university'],
        ['det_f1', 'detF1'],
        ['class_acc', 'classAcc'],
        ['region_cer', 'regionCer'],
        ['page_cer', 'pageCer'],
        ['usd_per_1k_pages', 'usdPer1kPages'],
        ['unparsed_pages', 'unparsedPages'],
      ] as const) {
        const v = num(r[col]);
        if (v !== undefined) metrics[k] = v;
      }

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(date ? { date } : {}),
        ...(open !== undefined ? { open } : {}),
        ...(params !== undefined ? { params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
