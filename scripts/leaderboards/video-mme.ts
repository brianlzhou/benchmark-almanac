// Video-MME (v1). video-mme.github.io/home_page.html is a static page with one leaderboard table: per model
// the overall accuracy without and with subtitles (0 to 100), then short, medium and long video splits.
// The page sorts by the with-subtitles overall; Epoch AI and many model cards report the frames-only score
// instead, so both overalls are kept as separate rows with the variant as the setting. The model cell holds
// the name (a link) above its organisation; the Date column is passed on for snapshot matching.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://video-mme.github.io/home_page.html';

const board: Leaderboard = {
  benchmark: 'video-mme',
  url: `${PAGE}#leaderboard`,
  feed: `${PAGE} (static HTML table, Overall without and with subtitles)`,
  terms: 'Static GitHub Pages site that states no terms; the scores are cited to the Video-MME team.',
  aliases: {
    // the paper's mid-2024 run, before the September update
    'Gemini 1.5 Pro': 'gemini-1-5-pro-may-2024',
    'Gemini 1.5 Flash': 'gemini-1-5-flash-may-2024',
  },
  async fetch() {
    const [t] = tables(await fetchText(PAGE));
    const head = t?.[0]?.map((c) => c.text);
    if (head?.[1] !== 'Model' || head?.[4] !== 'Date' || !/^Overall/.test(head?.[5] ?? '')) throw new Error(`unexpected Video-MME header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const name = r[1]?.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? r[1]?.html.replace(/<p\b[\s\S]*?<\/p>/, '');
      const model = name ? text(name) : '';
      const date = r[4]?.text.match(/\d{4}-\d\d-\d\d/)?.[0];
      const without = num(r[5]?.text);
      const withSubs = num(r[6]?.text);
      if (!model) continue;
      if (without !== undefined) rows.push({ model, score: without, setting: 'without subtitles', date });
      if (withSubs !== undefined) rows.push({ model, score: withSubs, setting: 'with subtitles', date });
    }
    return rows;
  },
};
export default board;
