// ToolSandbox tests stateful tool use. Its paper reports the average milestone score, scenario and tool scores, average turn counts and a separate ReAct comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2408.04682';

const board: Leaderboard = {
  benchmark: 'toolsandbox', static: 'paper',
  url: 'https://arxiv.org/abs/2408.04682',
  feed: FEED,
  terms: PAPER_TERMS,
  stats: { averageTurns: { name: 'Average turns', unit: 'count', better: 'lower' } },
  aliases: {"C4AI-Command R+": "command-r-plus", "Mistral-7B-Instruct-v0.3": "mistral-7b-v0-3"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.[1]?.startsWith('Avg Score'));
    const turns = tables.find(t => t[0]?.[1]?.startsWith('Avg Turn Count'));
    const react = tables.find(t => t[0]?.[2] === 'ReAct Score');
    if (!main || !turns || !react || main[1].length < 17 || main.length < 15 || react.length < 5) throw new Error('Incomplete ToolSandbox comparison');
    const parts = main[1].slice(2);
    board.parts = Object.fromEntries(parts.map((k, i) => [k, { name: k, group: main[0][i+2] }]));
    const number = (s: string) => {
      if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Invalid ToolSandbox value');
      return Number(s);
    };
    const rows: LeaderboardRow[] = main.slice(2).map(([model, score, ...scores]) => {
      const turn = turns.slice(2).find(r => r[0].replaceAll(' ', '-') === model.replaceAll(' ', '-'));
      if (!turn || scores.length !== parts.length) throw new Error('Missing ToolSandbox model columns');
      const metrics = Object.fromEntries(parts.map((k, i) => [k, number(scores[i])]));
      metrics.averageTurns = number(turn[1]);
      return { model, score: number(score), setting: 'Baseline', metrics };
    });
    for (const [model, baseline, score] of react.slice(1)) {
      if (!rows.some(r => r.model === model && r.score === number(baseline))) throw new Error('ToolSandbox baseline mismatch');
      rows.push({ model, setting: 'ReAct', score: number(score) });
    }
    return rows;
  },
};
export default board;
