// MMSI-Video-Bench measures spatial reasoning across video questions.
// The official leaderboard embeds whole-benchmark average accuracy for each frame sampling setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://rbler1234.github.io/MMSI-VIdeo-Bench.github.io/';
const PAPER = 'https://arxiv.org/html/2512.10863';
const parts = { sc: 'SC.', mu: 'MU.', plan: 'Plan.&Pred.', cv: 'CV.', hard: 'Hard', medium: 'Medium', easy: 'Easy' };
const key = (name: string) => name.toLowerCase().replace('qwenvl2.5-vl-7b-instruct', 'qwenvl2.5-7b');
const board: Leaderboard = {
  benchmark: 'mmsi-video-bench', url: FEED, feed: FEED, parts,
  terms: 'Public project leaderboard. The site returns 404 for robots.txt. The authors also publish category and difficulty scores on arXiv.',
  aliases: { 'QwenVL2.5-72B': 'qwen2-5-vl-72b', 'QwenVL2.5-32B': 'qwen2-5-vl-32b', 'QwenVL2.5-7B': 'qwen2-5-vl-7b', 'QwenVL2.5-VL-7B-Instruct': 'qwen2-5-vl-7b', 'QwenVL3-30B': 'qwen3-vl-30b-a3b-instruct', 'QwenVL3-30B (Thinking)': 'qwen3-vl-30b-a3b-thinking', 'QwenVL3-8B': 'qwen3-vl-8b-instruct', 'LLaVA-Video-7B': 'llava-video-7b-qwen2', 'LLaVA-Video-72B': 'llava-video-72b-qwen2' },
  async fetch() {
    const html = await fetchText(FEED);
    const table = inlinePaperTables(await paperHtml(PAPER)).find(t => t[0]?.join('|') === 'Methods|Avg|SC.|MU.|Plan.&Pred.|CV.|Hard|Medium|Easy');
    if (!table) throw new Error('Missing Table 3');
    const breakdown = new Map<string, { avg: number, metrics: Record<string, number> }>();
    let mode = '', prior = '';
    for (const [name, avg, ...vals] of table.slice(1)) {
      if (!avg) { mode = name.match(/^\(([^)]+)\)/)?.[1] ?? ''; continue; }
      const model = name === '-Thinking' ? prior + ' (Thinking)' : name;
      if (name !== '-Thinking') prior = name;
      if (vals.length !== 7 || vals.some(v => !/^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid MMSI breakdown');
      breakdown.set(mode + '/' + key(model), {avg: Number(avg), metrics: Object.fromEntries(Object.keys(parts).map((k, i) => [k, Number(vals[i])]))});
    }
    const rows: LeaderboardRow[] = [];
    for (const setting of ['Sufficient-Coverage', 'Uniform-50']) {
      const start = html.indexOf('"' + setting + ' Setting": [');
      if (start < 0) throw new Error('Missing MMSI frame setting');
      const section = html.slice(start, html.indexOf(']', start));
      const entries = [...section.matchAll(/\{model:"([^"]+)",\s*avg:(\d+(?:\.\d+)?),\s*type:"([^"]+)"\}/g)];
      if (entries.length !== (section.match(/model:/g) ?? []).length || entries.length < (setting === 'Uniform-50' ? 26 : 15)) throw new Error('Incomplete MMSI board');
      for (const [, name, raw, type] of entries) {
        if (type === 'Baseline') continue;
        const score = Number(raw);
        const detail = breakdown.get(setting + '/' + key(name));
        const thinking = name === 'Gemini 2.5 Flash (Thinking)';
        const model = thinking ? 'Gemini 2.5 Flash' : name;
        const row: LeaderboardRow = { model, score, setting: setting + (thinking ? ' / Thinking' : ''), open: type === 'Open-Source' };
        if (detail && Math.abs(detail.avg - score) <= 0.051) row.metrics = detail.metrics;
        rows.push(row);
      }
    }
    return rows;
  },
};
export default board;
