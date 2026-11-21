// KeyFrame-Compass tests video generation conditioned on an ordered set of keyframes.
// Table 3 ranks six joint audio-video models on 115 shared short-video samples in both prompt modes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2607.14202";
const header = ["Rank", "Model", "Keyframe Fidelity", "Temporal Organization", "Video Quality", "Spatiotemporal Coherence", "Instruction Adherence", "AV Coordination", "Overall"];
const columns: Record<string, number> = {"Keyframe Fidelity": 2, "Temporal Organization": 3, "Video Quality": 4, "Spatiotemporal Coherence": 5, "Instruction Adherence": 6, "AV Coordination": 7};
const board: Leaderboard = {
  benchmark: "keyframe-compass", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2607.14202." ,
  parts: {"Keyframe Fidelity": "Keyframe Fidelity", "Temporal Organization": "Temporal Organization", "Video Quality": "Video Quality", "Spatiotemporal Coherence": "Spatiotemporal Coherence", "Instruction Adherence": "Instruction Adherence", "AV Coordination": "AV Coordination"},
  headline: "The authors rank joint audio-video models on the 115 short-video samples shared across both prompt modes.",
  aliases: {"Seedance 2.0": "dreamina-seedance-2-0"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[1];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[8]);
      rows.push({ model, score, metrics });
    }
    return checked(rows, 6);
  },
};
export default board;
