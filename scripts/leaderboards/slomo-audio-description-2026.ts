// SLoMO ranks film audio descriptions by the final judge score. The workshop publishes separate main and size-limited standings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://slomo-workshop.github.io/eccv2026/#challenge";

const board: Leaderboard = {
  benchmark: "slomo-audio-description-2026",
  url: "https://slomo-workshop.github.io/eccv2026/#challenge",
  feed,
  terms: "Final main track count includes four teams and the organizer baseline. The special track has three teams and the same baseline. EvalAI restricts challenge data to research and noncommercial use. The results page gives no separate score license. https://slomo-workshop.github.io/eccv2026/ The feed host returns no robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [setting, minimum] of [['Main', 5], ['Special', 4]] as const) {
      const fragment = [...source.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].find(m => m[0].replaceAll('&middot;', '·').includes('AD Track · ' + setting));
      const [header, ...entries] = tables(fragment?.[0] ?? '')[0] ?? [];
      const columns = header?.map(c => c.text);
      if (!columns?.includes('Team') || !columns.includes('Score') || entries.length < minimum) throw new Error('Incomplete AD ' + setting);
      for (const entry of entries) {
        const model = entry[columns.indexOf('Team')].text, score = num(entry[columns.indexOf('Score')].text);
        if (!model || score === undefined) throw new Error('Missing AD score');
        rows.push({ model, submitter: model, setting, score });
      }
    }
    return rows;
  },
};
export default board;
