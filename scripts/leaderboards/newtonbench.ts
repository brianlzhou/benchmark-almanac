// NewtonBench main results from arXiv:2510.07172 HTML Table 2.
// Table 2 caption: "Experiment results aggregated over 12 domains by equation difficulty (easy, medium, hard)
// and system complexity, reported as mean and standard deviation from four runs."
// Headline uncertainty (±) is the standard deviation across four runs, stored verbatim in `metrics.std` with `trials: 4`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://arxiv.org/html/2510.07172';
const URL = 'https://arxiv.org/abs/2510.07172';

function parseMeanAndStd(cell: string): { mean?: number; std?: number } {
  const meanMatch = cell.match(/-?\d+(?:\.\d+)?/);
  if (!meanMatch) return {};
  const mean = Number(meanMatch[0]);
  const stdMatch = cell.match(/±\s*(\d+(?:\.\d+)?)/);
  const std = stdMatch ? Number(stdMatch[1]) : undefined;
  return {
    mean: Number.isFinite(mean) ? mean : undefined,
    std: std !== undefined && Number.isFinite(std) ? std : undefined,
  };
}

const board: Leaderboard = {
  benchmark: 'newtonbench',
  static: 'paper',
  url: URL,
  feed: FEED,
  terms: 'Results are read from the public arXiv HTML paper (arXiv:2510.07172, Table 2).',
  headline: 'Average symbolic accuracy across 324 scientific law discovery tasks spanning 12 physics domains, three system complexities, and three difficulty levels (mean of four runs).',
  parts: {
    vanillaEasy: { name: 'Easy', group: 'Vanilla equation' },
    vanillaMedium: { name: 'Medium', group: 'Vanilla equation' },
    vanillaHard: { name: 'Hard', group: 'Vanilla equation' },
    simpleEasy: { name: 'Easy', group: 'Simple system' },
    simpleMedium: { name: 'Medium', group: 'Simple system' },
    simpleHard: { name: 'Hard', group: 'Simple system' },
    complexEasy: { name: 'Easy', group: 'Complex system' },
    complexMedium: { name: 'Medium', group: 'Complex system' },
    complexHard: { name: 'Hard', group: 'Complex system' },
  },
  stats: {
    rmsle: { name: 'RMSLE', unit: 'score', better: 'lower', note: 'Root mean squared logarithmic error of predicted laws.' },
    totalTokens: { name: 'Total tokens per task', unit: 'tokens', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(FEED);
    const figures = [...html.matchAll(/<figure[^>]*class="[^"]*ltx_table[^"]*"[^>]*>[\s\S]*?<\/figure>/gi)].map((m) => m[0]);
    const mainFig = figures.find((f) => /Vanilla Equation/i.test(f) && /Complex System/i.test(f) && /RMSLE/i.test(f));
    if (!mainFig) throw new Error('NewtonBench Table 2 not found in arXiv HTML');

    const rows: LeaderboardRow[] = [];
    let currentSetting = 'Vanilla Agent';

    for (const tr of mainFig.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => text(c[1]));
      if (!cells.length) continue;

      if (cells.length <= 3 && /Vanilla Agent/i.test(cells[0])) {
        currentSetting = 'Vanilla Agent';
        continue;
      }
      if (cells.length <= 3 && /Code Assistance/i.test(cells[0])) {
        currentSetting = 'Agent with Code Assistance';
        continue;
      }
      if (cells.length < 13) continue;

      const model = cells[0].trim();
      if (!model || /^LLM Agents$/i.test(model)) continue;

      const avg = parseMeanAndStd(cells[10]);
      if (avg.mean === undefined) continue;

      const metrics: Record<string, number> = {};
      const partKeys = [
        'vanillaEasy',
        'vanillaMedium',
        'vanillaHard',
        'simpleEasy',
        'simpleMedium',
        'simpleHard',
        'complexEasy',
        'complexMedium',
        'complexHard',
      ] as const;

      partKeys.forEach((k, idx) => {
        const parsed = parseMeanAndStd(cells[idx + 1]);
        if (parsed.mean !== undefined) metrics[k] = parsed.mean;
      });

      if (avg.std !== undefined) metrics.std = avg.std;

      const rmsle = parseMeanAndStd(cells[11]).mean;
      if (rmsle !== undefined) metrics.rmsle = rmsle;

      const tokensK = parseMeanAndStd(cells[12]).mean;
      if (tokensK !== undefined) metrics.totalTokens = Math.round(tokensK * 1000);

      rows.push({
        model,
        score: avg.mean,
        setting: currentSetting,
        trials: 4,
        metrics,
      });
    }

    if (rows.length < 18) {
      throw new Error(`Expected at least 18 rows in NewtonBench Table 2, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
