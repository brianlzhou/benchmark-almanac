// RoboDojo-Mirror: robot manipulation success-rate drop across mirror conditions, with per-condition success rates and task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://ipplab.github.io/robodojo-mirror/';
const SITE_JS = 'https://ipplab.github.io/robodojo-mirror/site.js';

const board: Leaderboard = {
  benchmark: 'robodojo-mirror',
  url: PAGE,
  feed: PAGE,
  static: 'paper',
  terms: 'Public paper results published by Peking University on the RoboDojo-Mirror project site.',
  parts: {
    noMirror: { name: 'No mirror', group: 'Success rate', better: 'higher' },
    singleMirror: { name: 'Single mirror', group: 'Success rate', better: 'higher' },
    dualMirrors: { name: 'Dual mirrors', group: 'Success rate', better: 'higher' },
    mirroredTabletop: { name: 'Mirrored tabletop', group: 'Success rate', better: 'higher' },
  },
  stats: {
    taskNoMirror: { name: 'Task score (no mirror)', unit: 'score', better: 'higher' },
    taskSingleMirror: { name: 'Task score (single mirror)', unit: 'score', better: 'higher' },
    taskDualMirrors: { name: 'Task score (dual mirrors)', unit: 'score', better: 'higher' },
    taskMirroredTabletop: { name: 'Task score (mirrored tabletop)', unit: 'score', better: 'higher' },
    taskMeanDrop: {
      name: 'Task score mean drop',
      unit: 'score',
      better: 'lower',
      note: 'Average decrease in native task score across the three mirror conditions.',
    },
  },

  async fetch(): Promise<LeaderboardRow[]> {
    const [html, js] = await Promise.all([fetchText(PAGE), fetchText(SITE_JS)]);
    const tbodyMatch = html.match(/<tbody[^>]*id="results-body"[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) throw new Error('Missing #results-body table in RoboDojo-Mirror page');

    const scoreRows: number[][] = [];
    const scoreBlock = js.match(/const\s+score\s*=\s*\[([\s\S]*?)\];/);
    if (scoreBlock) {
      const rowRe = /\[([^\]]+)\]/g;
      let rm: RegExpExecArray | null;
      while ((rm = rowRe.exec(scoreBlock[1])) !== null) {
        const nums = [...rm[1].matchAll(/"([0-9.]+)"/g)].map((m) => Number(m[1]));
        if (nums.length === 5) scoreRows.push(nums);
      }
    }

    const rows: LeaderboardRow[] = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let tr: RegExpExecArray | null;
    let idx = 0;
    while ((tr = trRe.exec(tbodyMatch[1])) !== null) {
      const thMatch = tr[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i);
      if (!thMatch) continue;
      const model = thMatch[1].replace(/<[^>]+>/g, '').trim();
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
        Number(m[1].replace(/<[^>]+>/g, '').trim()),
      );
      if (tds.length < 5 || !tds.every(Number.isFinite)) continue;

      const metrics: Record<string, number> = {
        noMirror: tds[0],
        singleMirror: tds[1],
        dualMirrors: tds[2],
        mirroredTabletop: tds[3],
      };
      const ts = scoreRows[idx];
      if (ts && ts.length === 5) {
        metrics.taskNoMirror = ts[0];
        metrics.taskSingleMirror = ts[1];
        metrics.taskDualMirrors = ts[2];
        metrics.taskMirroredTabletop = ts[3];
        metrics.taskMeanDrop = ts[4];
      }

      rows.push({
        model,
        score: tds[4],
        metrics,
      });
      idx++;
    }

    if (rows.length < 4) {
      throw new Error(`Expected RoboDojo-Mirror policy rows, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
