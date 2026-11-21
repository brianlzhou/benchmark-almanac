// CivBench tests agents playing Civilization VI. Read the authors' games table and use their
// admissible flag. The dashboard rounds the mean overall dimension score over a model's games.
// The pilot uses unequal scenario counts across models.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchJson } from '../lib/util.ts';
const feed = 'https://datasets-server.huggingface.co/rows?dataset=civbench%2Fcivbench-v1&config=tables&split=games';
const parts = { economic:'Economic', military:'Military', scientific:'Scientific', diplomatic:'Diplomatic',
  spatial:'Spatial', toolFluency:'Tool fluency', coherence:'Coherence' };
type Game = { admissible: boolean | null; agentModel: string; evalTrack: string; dimensionScores: string; score: number; outcome: string; gameId: string };
export default {
  benchmark: 'civbench-civilization-vi', url: 'https://huggingface.co/datasets/civbench/civbench-v1', feed, parts,
  stats: {
    gameScore: { name: 'Game score', unit: 'score', better: 'higher' },
    wins: { name: 'Wins', unit: 'count' },
  },
  terms: 'CC BY 4.0, https://huggingface.co/datasets/civbench/civbench-v1/blob/main/LICENSE',
  headline: 'This is the mean overall dimension score across each model’s admissible pilot games, rounded as in the dashboard.',
  async fetch() {
    const groups = new Map<string, Game[]>();
    const seen = new Set<string>();
    let total = Infinity;
    for (let offset = 0; offset < total; offset += 100) {
      if (offset) await new Promise(resolve => setTimeout(resolve,1000));
      const page = await fetchJson<{num_rows_total:number;rows:{row:Game;truncated_cells:string[]}[]}>(feed + '&offset=' + offset + '&length=100');
      total = page.num_rows_total;
      if (page.rows.length !== Math.min(total-offset,100)) throw new Error('Incomplete games page');
      for (const {row, truncated_cells} of page.rows) {
        if (row.admissible !== true) continue;
        if (truncated_cells.length || seen.has(row.gameId) || !row.agentModel) throw new Error('Invalid admissible game');
        seen.add(row.gameId);
        const key = JSON.stringify([row.agentModel,row.evalTrack]);
        const list = groups.get(key) ?? [];
        list.push(row);
        groups.set(key,list);
      }
    }
    return checked([...groups.values()].map(games => {
      const dims = games.map(g => JSON.parse(g.dimensionScores));
      const average = (key:string) => {
        if (!dims.every(d => Number.isFinite(d[key]))) throw new Error('Missing dimension ' + key);
        return Math.round(dims.reduce((sum,d) => sum + d[key],0) / games.length);
      };
      const metrics = Object.fromEntries(Object.keys(parts).map(k => [k,average(k)]));
      metrics.gameScore = games.reduce((sum,g) => sum + g.score,0) / games.length;
      metrics.wins = games.filter(g => JSON.parse(g.outcome).result === 'victory').length;
      return {model:games[0].agentModel, setting:games[0].evalTrack, score:average('overall'), trials:games.length, metrics};
    }),4);
  },
} satisfies Leaderboard;
