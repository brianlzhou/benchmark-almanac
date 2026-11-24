// OmniSpatial: Overall accuracy (Avg) and ten spatial reasoning subtask scores from the official project page.
// Reads all 38 evaluated models from https://qizekun.github.io/omnispatial/ instead of the 3-row README summary.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://qizekun.github.io/omnispatial/';
const board: Leaderboard = {
  benchmark: 'omnispatial',
  url: PAGE,
  feed: PAGE,
  terms: 'Public source published by the benchmark authors. Source licensing and attribution requirements apply.',
  parts: {
    Manip: { name: 'Manipulation', group: 'Dynamic reasoning' },
    Motion: { name: 'Motion', group: 'Dynamic reasoning' },
    Traffic: { name: 'Traffic', group: 'Spatial interaction' },
    Locate: { name: 'Localization', group: 'Spatial interaction' },
    Geospatial: { name: 'Geospatial', group: 'Spatial interaction' },
    Pattern: { name: 'Pattern', group: 'Complex spatial logic' },
    Geometric: { name: 'Geometric', group: 'Complex spatial logic' },
    Ego: { name: 'Egocentric', group: 'Perspective taking' },
    Allo: { name: 'Allocentric', group: 'Perspective taking' },
    Hypo: { name: 'Hypothetical', group: 'Perspective taking' },
  },
  aliases: {
    'o4-mini-04-16': 'o4-mini',
    'Claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'Gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
    'Gemini-2.5-flash-preview-05-20': 'gemini-2-5-flash-may-2025',
    'Gemini-2.0-flash-exp': 'gemini-2-0-flash-dec-2024',
    'Qwen-VL2.5-72B': 'qwen2-5-vl-72b',
    'Qwen-VL2.5-32B': 'qwen2-5-vl-32b',
    'Qwen-VL2.5-7B': 'qwen2-5-vl-7b',
    'Qwen-VL2.5-3B': 'qwen2-5-vl-3b',
    'LLaVA-onevision-qwen2-72B': 'llava-onevision-72b',
    'LLaVA-onevision-qwen2-7B': 'llava-onevision-7b',
    'LLaVA-1.5-vicuna-7B': 'llava-v1-5-7b',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t = tables(await fetchText(PAGE)).find((tbl) => tbl[0]?.[0]?.text === 'Model' && tbl[0]?.[1]?.text === 'Avg');
    if (!t) throw new Error('OmniSpatial project leaderboard table missing');
    const headers = t[0].map((c) => c.text.trim());
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const raw = r[0]?.text.replace(/^[🥇🥈🥉🏅\s]+/u, '').trim();
      const score = num(r[1]?.text);
      if (!raw || score === undefined || /human|random/i.test(raw)) continue;
      let model = raw;
      let setting: string | undefined;
      if (raw === 'Claude-3-7-thinking-20250219') {
        model = 'Claude-3-7-sonnet-20250219';
        setting = 'thinking';
      }
      const metrics: Record<string, number> = {};
      for (let i = 2; i < headers.length; i++) {
        const v = num(r[i]?.text);
        if (v !== undefined) metrics[headers[i]] = v;
      }
      rows.push({ model, ...(setting ? { setting } : {}), score, metrics });
    }
    if (rows.length < 30) throw new Error(`Expected at least 30 OmniSpatial rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
