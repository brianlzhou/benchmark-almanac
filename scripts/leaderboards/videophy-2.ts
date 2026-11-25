// VideoPhy-2. videophy2.github.io carries its leaderboard as two static HTML tables (open and closed video
// models): per model the joint score (share of videos that human raters scored high on both semantic
// adherence and physical commonsense) on all 200 prompts and on the hard subset, plus physical-activity
// and object-interaction splits. All, the joint score on the full prompt set, is the score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://videophy2.github.io/';

const board: Leaderboard = {
  benchmark: 'videophy-2',
  url: PAGE,
  feed: `${PAGE} (static HTML tables, All)`,
  terms: 'Static project page on GitHub Pages (no robots.txt rules); the site states no terms.',
  parts: {
    hard: 'Hard prompts',
    physicalActivity: 'Physical activity',
    objectInteraction: 'Object interaction',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(PAGE))) {
      const head = t[0]?.map((c) => c.text) ?? [];
      const iModel = head.indexOf('Model');
      const iType = head.indexOf('Type');
      const iAll = head.indexOf('All');
      const iHard = head.indexOf('Hard');
      const iPa = head.indexOf('PA');
      const iOi = head.indexOf('OI');
      const iRep = head.indexOf('Reported in');
      if (iModel < 0 || iAll < 0) continue;
      for (const r of t.slice(1)) {
        const model = r[iModel]?.text;
        const score = num(r[iAll]?.text);
        if (!model || score === undefined) continue;
        const typ = iType >= 0 ? r[iType]?.text.trim().toLowerCase() : '';
        const open = typ === 'open' ? true : typ === 'closed' ? false : undefined;
        const link = iRep >= 0 ? r[iRep]?.html.match(/href="(https?:\/\/[^"]+)"/i)?.[1] : undefined;
        const metrics: Record<string, number> = {};
        const hard = iHard >= 0 ? num(r[iHard]?.text) : undefined;
        const pa = iPa >= 0 ? num(r[iPa]?.text) : undefined;
        const oi = iOi >= 0 ? num(r[iOi]?.text) : undefined;
        if (hard !== undefined) metrics.hard = hard;
        if (pa !== undefined) metrics.physicalActivity = pa;
        if (oi !== undefined) metrics.objectInteraction = oi;
        rows.push({
          model,
          score,
          ...(open !== undefined ? { open } : {}),
          ...(link ? { link } : {}),
          ...(Object.keys(metrics).length ? { metrics } : {}),
        });
      }
    }
    if (!rows.length) throw new Error('no VideoPhy-2 leaderboard tables found');
    return rows;
  },
};
export default board;
