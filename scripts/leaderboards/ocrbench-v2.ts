// OCRBench v2, private test data, English tasks. 99franklin.github.io/ocrbench_v2/ is a static page with
// one pair of tables per leaderboard round (2026.09 back to 2025.06, newest first): English, then Chinese.
// Each round keeps its newly evaluated models plus the best models carried over from the round before, so
// older models drop out of later rounds. The importer reads every round's English table (Average, 0 to
// 100, the ranking column) and keeps each model's newest round, passing the round's month as the date so
// the resolver picks the snapshot current then. Chinese tasks are a separate average and are not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://99franklin.github.io/ocrbench_v2/';

const board: Leaderboard = {
  benchmark: 'ocrbench-v2',
  url: PAGE,
  feed: `${PAGE} (static HTML, English table of each round, Average)`,
  terms: 'Static GitHub Pages site that states no terms; the MultimodalOCR repository is MIT.',
  aliases: {
    'Gemini1.5-Pro': 'gemini-1-5-pro-sept-2024',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const periods = [...html.matchAll(/<option[^>]*value="(\d{4})\.(\d{2})"/g)].map((m) => `${m[1]}-${m[2]}-28`);
    const all = tables(html);
    // tables come in English/Chinese pairs, one pair per round, in the selector's order
    if (!periods.length || all.length !== periods.length * 2) throw new Error(`expected ${periods.length * 2} OCRBench v2 tables, got ${all.length}`);
    const seen = new Set<string>();
    const rows: LeaderboardRow[] = [];
    periods.forEach((date, i) => {
      const t = all[i * 2];
      const head = t[0]?.map((c) => c.text);
      if (head?.[1] !== 'Method' || head?.[5] !== 'Average') throw new Error(`unexpected OCRBench v2 header: ${head?.join(' | ')}`);
      for (const r of t.slice(1)) {
        const model = r[1]?.text.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
        const score = num(r[5]?.text);
        if (!model || score === undefined || seen.has(model)) continue;
        seen.add(model);
        rows.push({ model, score, date });
      }
    });
    return rows;
  },
};
export default board;
