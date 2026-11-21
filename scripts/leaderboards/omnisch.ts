// OmniSch ranks schematic-to-netlist generation by graph IoU. The first table embeds scores for each image input. The visual search task uses a different ranking.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://omnisch.com/";

const board: Leaderboard = {
  benchmark: "omnisch",
  url: "https://omnisch.com/#leaderboard",
  feed,
  terms: "The site licenses its content under CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/ robots.txt permits reference use and excludes named AI crawlers.",
  stats: {
    'Symbol Eq.(1)': { name: 'Symbol exact match', unit: 'score', better: 'higher', note: 'Symbol extraction exact-match score, from 0 to 1.' },
    'Symbol IoU': { name: 'Symbol intersection over union', unit: 'score', better: 'higher', note: 'Symbol extraction intersection-over-union score, from 0 to 1.' },
    'Symbol Name': { name: 'Symbol name score', unit: 'score', better: 'higher', note: 'Symbol name extraction score, from 0 to 1.' },
    'Symbol Value': { name: 'Symbol value score', unit: 'score', better: 'higher', note: 'Symbol value extraction score, from 0 to 1.' },
    'Symbol Type': { name: 'Symbol type score', unit: 'score', better: 'higher', note: 'Symbol type extraction score, from 0 to 1.' },
    'Pin Eq.(2)': { name: 'Pin exact match', unit: 'score', better: 'higher', note: 'Pin extraction exact-match score, from 0 to 1.' },
    'Pin IoU': { name: 'Pin intersection over union', unit: 'score', better: 'higher', note: 'Pin extraction intersection-over-union score, from 0 to 1.' },
    PinName: { name: 'Pin name score', unit: 'score', better: 'higher', note: 'Pin name extraction score, from 0 to 1.' },
    PadName: { name: 'Pad name score', unit: 'score', better: 'higher', note: 'Pad name extraction score, from 0 to 1.' },
    'Net F1': { name: 'Netlist F1 score', unit: 'score', better: 'higher', note: 'Netlist extraction F1 score, from 0 to 1.' },
    NetName: { name: 'Net name score', unit: 'score', better: 'higher', note: 'Net name extraction score, from 0 to 1.' },
    'Graph IoU': { name: 'Graph intersection over union', unit: 'score', better: 'higher', note: 'Schematic graph intersection-over-union score, from 0 to 1.' },
    '1-GED': { name: 'One minus graph edit distance', unit: 'score', better: 'higher', note: 'Normalized graph similarity defined as one minus graph edit distance.' },
    'Kendall’s τ': { name: 'Kendall rank correlation', unit: 'score', better: 'higher' },
    Pass: { name: 'Pass rate', unit: 'score', better: 'higher', note: 'Fraction of schematic-to-netlist evaluations that pass.' },
  },
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
