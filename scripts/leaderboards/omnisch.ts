// OmniSch ranks schematic-to-netlist generation by graph IoU. The first table embeds scores for each image input. The visual search task uses a different ranking.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://omnisch.com/";

const board: Leaderboard = {
  benchmark: "omnisch",
  url: "https://omnisch.com/#leaderboard",
  feed,
  terms: "The site licenses its content under CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/ robots.txt permits reference use and excludes named AI crawlers.",
  async fetch() {
    const source = (await fetchText(feed)).split('const T1 = [')[1]?.split('\n];')[0] ?? '';
    const names = ['Symbol Eq.(1)', 'Symbol IoU', 'Symbol Name', 'Symbol Value', 'Symbol Type', 'Pin Eq.(2)', 'Pin IoU', 'PinName', 'PadName', 'Net F1', 'NetName', 'Graph IoU', '1-GED', "Kendall’s τ", 'Pass'];
    const rows: LeaderboardRow[] = [];
    for (const m of source.matchAll(/m:'([^']+)', sz:'([^']+)', rows:\[([\s\S]*?)\n\s*\]\}/g)) {
      if (['Classical Vision Pipeline', 'Human Engineer'].includes(m[1])) continue;
      for (const run of m[3].matchAll(/i:'([^']+)',\s*g:\d+,\s*v:\[([^\]]+)\]/g)) {
        const cells = run[2].split(',').map(s => s.trim() === 'null' ? null : Number(s));
        if (cells.length !== names.length || cells.some(v => v !== null && !Number.isFinite(v))) throw new Error('Changed schematic metrics');
        const score = cells[11];
        if (score === null) continue;
        const metrics = Object.fromEntries(names.flatMap((k, i) => cells[i] === null ? [] : [[k, cells[i]!]]));
        rows.push({ model: m[1], setting: run[1], score, metrics, open: m[2] !== '—', params: parseFloat(m[2]) || undefined });
      }
    }
    if (rows.length < 45) throw new Error('Missing OmniSch runs: ' + rows.length);
    return rows;
  },
};

export default board;
