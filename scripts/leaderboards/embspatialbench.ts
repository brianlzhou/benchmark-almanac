// Read the baseline, fine-tuning ablations, dataset scores and spatial relations in Tables 2 through 4.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2406.05756';
const board: Leaderboard = {
  benchmark: 'embspatialbench', url: URL, feed: URL + ' (generation and likelihood on the complete benchmark)', terms: PAPER_TERMS,
  aliases: {"LLaVA-1.6 7B": "llava-v1-6-vicuna-7b"},
  async fetch() {
    const ts = inlinePaperTables(await paperHtml(URL));
    const t = ts.find(t => t[0]?.join('|') === 'Model|Generation|Likelihood');
    if (!t) throw new Error('EmbSpatialBench table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1).filter(r => r[0] !== 'Human')) {
      let model = r[0].replace(/ \([^)]*\)$/, '');
      const closed = /GPT-4V|Qwen-VL-Max/.test(model);
      if (model === 'GPT-4V') model = 'gpt-4-1106-vision-preview';
      else if (model === 'Qwen-VL-Max') model += ' (snapshot unspecified)';
      else model += ' 7B';
      for (const i of [1, 2]) if (Number.isFinite(Number(r[i]))) rows.push({model, score: Number(r[i]), setting: t[0][i], open: !closed, params: closed ? undefined : 7});
    }
    const byDataset = ts.find(t => t[1]?.includes('AI2-THOR') && t[1]?.includes('All'));
    const relations = ts.find(t => t[2]?.includes('above'));
    board.parts = {};
    const variants = new Map<string, LeaderboardRow>();
    let mode = '';
    for (const r of byDataset?.slice(2) ?? []) {
      if (r.includes('Generation') || r.includes('Likelihood')) { mode = r[1]; continue; }
      const score = Number(r[4]);
      if (!mode || !Number.isFinite(score)) continue;
      const base = r[0].startsWith('MiniGPT-v2');
      const row: LeaderboardRow | undefined = base ? rows.find(row => row.model === 'MiniGPT-v2 7B' && row.setting === mode && row.score === score) :
        { model: 'MiniGPT-v2 7B', score, setting: mode + ', EmbSpatial-SFT' + (r[0].startsWith('w/o') ? ', ' + r[0] : ''), open: true, params: 7 };
      if (!row) continue;
      if (!base) rows.push(row);
      variants.set(mode + ':' + (base ? 'MiniGPT-v2' : r[0]), row);
      for (let i = 1; i <= 3; i++) {
        const key = byDataset![1][i];
        (row.metrics ??= {})[key] = Number(r[i]);
        board.parts[key] = { name: key, group: 'Dataset' };
      }
    }
    for (const r of relations?.slice(3) ?? []) {
      if (r.includes('Generation') || r.includes('Likelihood')) { mode = r[1]; continue; }
      const row = variants.get(mode + ':' + r[0]);
      if (!row) continue;
      for (let i = 1; i < r.length; i++) {
        const group = relations![1][i].replace('AI2THOR', 'AI2-THOR'), name = relations![2][i];
        const key = group + ':' + name;
        (row.metrics ??= {})[key] = Number(r[i]);
        board.parts[key] = { group, name };
      }
    }
    if (rows.length < 3) throw new Error('EmbSpatialBench has too few rows');
    return rows;
  },
};
export default board;
