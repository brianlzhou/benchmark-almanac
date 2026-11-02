// WBench (Meituan LongCat). meituan-longcat.github.io/WBench is a static page with its leaderboards as HTML
// tables. The page opens on the "Navi" split (table#table-navi, the 158 navigation cases every model runs);
// the "Full" split (all 289 cases) covers only the text-conditioned models. The Navi table's Average (0 to
// 100, the default sort) is the score. Model cells read "Name<br>variant tags<br>Creator · availability";
// the name before the first <br> is the model. Most entries are world models not in the registry; the
// video generators (Kling, Seedance, Wan, HunyuanVideo) are mapped by alias.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://meituan-longcat.github.io/WBench/';

const board: Leaderboard = {
  benchmark: 'wbench-meituan',
  url: `${URL}#leaderboard`,
  feed: `${URL} (table#table-navi, Average)`,
  terms: 'Static GitHub Pages site of the WBench project; robots.txt allows all and the WBench repository is MIT-licensed.',
  aliases: {
    'HY-Video 1.5': 'hunyuan-video-1-5',
    'Seedance 1.5': 'seedance-v1-5-pro',
    'Kling 3.0': 'kling-v3-pro',
    // WBench types Wan 2.7 as a text-conditioned model
    'Wan 2.7': 'wan2-7-t2v',
  },
  async fetch() {
    const html = await fetchText(URL);
    const start = html.indexOf('<table id="table-navi"');
    if (start < 0) throw new Error('WBench Navi table not found');
    const [t] = tables(html.slice(start));
    const head = t[0].map((c) => c.text);
    const iModel = head.findIndex((h) => /^Model/.test(h));
    const iAvg = head.findIndex((h) => /^Average/.test(h));
    if (iModel < 0 || iAvg < 0) throw new Error(`unexpected WBench columns: ${head.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = text(r[iModel]?.html.split(/<br/i)[0] ?? '');
      const score = num(r[iAvg]?.text);
      if (!model || score === undefined) continue;
      rows.push({ model, score });
    }
    return rows;
  },
};
export default board;
