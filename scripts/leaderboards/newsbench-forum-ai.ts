// Forum AI publishes overall NewsBench scores and three component scores. The overview page embeds these scores and component confidence intervals.
import type { Leaderboard } from './types.ts';
import { jsonAfter } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://byforum.com/newsbench";
const board: Leaderboard = {
  benchmark: 'newsbench-forum-ai',
  url: "https://byforum.com/newsbench",
  feed,
  terms: "The site allows crawling. Forum AI reserves all rights. The page embeds the scores and gives no separate reuse license. https://byforum.com/newsbench/v/may-2026",
  parts: { neutrality: 'Neutrality', factuality: 'Factuality', sourceTransparency: 'Source Quality' },
  async fetch() {
    const page = await fetchText(feed);
    const models = jsonAfter<{id: string; name: string}[]>(page, 'const MODELS = ');
    const overall = jsonAfter<Record<string, number>>(page, 'const OVERALL = ');
    const parts = jsonAfter<Record<string, Record<string, number>>>(page, 'const SUB_SCORES = ');
    const cis = jsonAfter<Record<string, Record<string, {lower: number; upper: number}>>>(page, 'const SUB_SCORE_CIS = ');
    if (models.length < 8) throw new Error('Missing NewsBench models');
    return models.map(m => {
      const score = overall[m.id], metrics: Record<string, number> = {};
      if (!m.name || !Number.isFinite(score)) throw new Error('Missing overall score');
      for (const key of Object.keys(board.parts!)) {
        const part = parts[key]?.[m.id], ci = cis[key]?.[m.id];
        if (!Number.isFinite(part) || !ci) throw new Error('Incomplete NewsBench dimension');
        metrics[key] = part;
        metrics[key + 'Low'] = ci.lower;
        metrics[key + 'High'] = ci.upper;
      }
      return { model: m.name, score, metrics };
    });
  },
};
export default board;
