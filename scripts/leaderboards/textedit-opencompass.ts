// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// TextEdit measures image text editing on Real and Virtual images. The README reports a judged Avg for each.
// The 500-image mini set samples from the full benchmark and does not enter its mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { sourceBoard } from '../lib/boards/textedit-opencompass.ts';

const board: Leaderboard = {
  ...sourceBoard,
  aliases: { "Nano Banana Pro": "gemini-3-pro-image-preview-nano-banana-pro" },
  terms: 'OpenCompass publishes the score tables at ' + sourceBoard.url,
  headline: 'The README reports no overall score. The headline is the plain mean of the Real and Virtual judged averages on the full benchmark.',
  async fetch() {
    const rows = new Map<string, LeaderboardRow>();
    const parts: Record<string,string> = {};
    for (const run of await sourceBoard.fetch()) {
      const match = run.setting?.match(/^Full; (Real|Virtual); judged average$/);
      if (!match) continue;
      const split = match[1];
      const row = rows.get(run.model) ?? { model: run.model, score: 0, metrics: {} };
      if (split in row.metrics!) throw new Error('Duplicate TextEdit split');
      if (!Number.isFinite(run.score)) throw new Error('Missing judged average');
      row.metrics![split] = run.score;
      parts[split] = split;
      for (const [key,value] of Object.entries(run.metrics ?? {})) {
        if (key !== 'Avg') row.metrics![split + ': ' + key] = value;
      }
      rows.set(run.model,row);
    }
    board.parts = parts;
    const complete = [...rows.values()].filter(r => 'Real' in r.metrics! && 'Virtual' in r.metrics!);
    for (const row of complete) row.score = (row.metrics!.Real + row.metrics!.Virtual) / 2;
    return checked(complete, 7);
  },
};
export default board;
