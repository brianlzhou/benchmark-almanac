// BoolQ on the SuperGLUE board. super.gluebenchmark.com shows each task as a column of its leaderboard; the
// data comes from the public Firebase database that superglue.ts reads (the best SuperGLUE 2.0 submission
// per uploader). The score is the BoolQ column: accuracy, the board's only BoolQ number. Rows carry the submission date.
import type { Leaderboard } from './types.ts';
import { SUPERGLUE_ALIASES, SUPERGLUE_FEED, SUPERGLUE_PAGE, SUPERGLUE_TERMS, superglueRows } from './superglue.ts';

const board: Leaderboard = {
  verified: 'approved for publication by SuperGLUE administrators',
  benchmark: 'boolq',
  url: SUPERGLUE_PAGE,
  feed: `${SUPERGLUE_FEED}, task BoolQ`,
  terms: SUPERGLUE_TERMS,
  aliases: SUPERGLUE_ALIASES,
  async fetch() {
    const details = new Map<string, { metrics: Record<string, number>; link?: string }>();
    const rows = await superglueRows((r, task) => {
      const result = task('BoolQ');
      const info = r.editable;
      if (!result || !info?.name) return undefined;
      const metrics: Record<string, number> = {};
      for (const [key, value] of [...Object.entries(info), ...Object.entries(result)]) {
        if (['correct', 'total', 'fineTunedParameters', 'woFineTuningParameters', 'taskSpecificParameters'].includes(key)
          && typeof value === 'number' && value >= 0) metrics[key] = value;
      }
      const date = new Date(r.createdOn).toISOString().slice(0, 10);
      details.set(JSON.stringify([info.name.trim(), date, Number((result.score * 100).toFixed(2))]), {
        metrics, link: /^https?:\/\//.test(info.url ?? '') ? info.url : undefined,
      });
      return result.score;
    });
    return rows.map(row => ({ ...row, ...details.get(JSON.stringify([row.model, row.date, row.score])) }));
  },
};
export default board;
