// Humanity's Last Exam: lastexam.ai points to Scale's leaderboard (made with CAIS) for current results.
// The page ships its rows as a JSON "entries" array inside the Next.js flight data in its script tags.
// Each row keeps the board's "±" (confidenceInterval_upper) as metrics.ciLow and ciHigh, and its Calibration
// Error column (calibrationError, in percent) as metrics.calibration.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, type ScaleEntry, effortBeforeDate, fetchScaleEntries, scaleFeed, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('humanitys_last_exam');

const board: Leaderboard = {
  benchmark: 'humanitys-last-exam',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {
    // effort words are split off before these are looked up ("-thinking-max" -> max)
    'claude-opus-4-6-thinking': 'claude-opus-4-6',
    'claude-opus-4-5-20251101': 'claude-opus-4-5',
    'claude-opus-4-1-20250805': 'claude-opus-4-1',
    'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5',
    // the importer moves "(high)" out of "o3 (high) (April 2025)" into the setting
    'o3 (April 2025)': 'o3',
    'o4-mini (April 2025)': 'o4-mini',
    'o1 (December 2024)': 'o1',
    'Gemini 2.5 Pro Experimental (March 2025)': 'gemini-2-5-pro-mar-2025',
    'Gemini 2.5 Pro Preview (May 06 2025)': 'gemini-2-5-pro-may-2025',
    'Gemini 2.5 Flash (April 2025)': 'gemini-2-5-flash-apr-2025',
    'Gemini 2.5 Flash Preview (May 2025)': 'gemini-2-5-flash-may-2025',
    'Gemini 2.0 Flash Thinking (January 2025)': 'gemini-2-0-flash-thinking-jan-2025',
    'Gemini-1.5-Pro-002': 'gemini-1-5-pro-sept-2024',
    'GPT-4o (November 2024)': 'gpt-4o-nov-2024',
    'glm-4p5': 'glm-4-5',
    'glm-4p5-air': 'glm-4-5-air',
    'Nova Pro': 'amazon-nova-pro',
    'Nova Lite': 'amazon-nova-lite',
  },
  async fetch() {
    const entries = await fetchScaleEntries(PAGE);
    return entries
      .filter((e) => !e.deprecated)
      .map((e) => {
        const { model, setting } = effortBeforeDate(e.model);
        const score = Number(e.score);
        const x = e as ScaleEntry & { confidenceInterval_upper?: number; calibrationError?: number };
        const half = Number(x.confidenceInterval_upper);
        const calibration = Number(x.calibrationError);
        const metrics = {
          ...(half > 0 ? { ciLow: score - half, ciHigh: score + half } : {}),
          ...(x.calibrationError != null && Number.isFinite(calibration) ? { calibration } : {}),
        };
        return { model, score, setting, date: e.createdAt?.slice(0, 10), ...(Object.keys(metrics).length ? { metrics } : {}) };
      });
  },
};
export default board;
