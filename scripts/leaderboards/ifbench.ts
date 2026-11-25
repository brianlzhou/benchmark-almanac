// Read the headline results, the IFBench constraint breakdown, and the training and turn configurations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2507.02833';
// Training variants are separate models. Never credit IF-RLVR fine-tunes to their base models.
const names: Record<string, string> = {'Tülu -sft': 'Llama-3.1-Tulu-3-8B-SFT', 'Tülu -DPO': 'Llama-3.1-Tulu-3-8B-DPO', 'Tülu': 'Llama-3.1-Tulu-3-8B'};
const board: Leaderboard = {
  benchmark: 'ifbench', static: 'paper', url: URL, feed: URL + ' (Tables 2, 3, 5, 6 and 7)', terms: PAPER_TERMS,
  parts: {
    count: { name: 'Count', group: 'Constraint type' },
    format: { name: 'Format', group: 'Constraint type' },
    words: { name: 'Words', group: 'Constraint type' },
    'sent.': { name: 'Sentence', group: 'Constraint type' },
  },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(URL)).map(grid);
    const t = tables.find(t => t[0]?.[2] === 'IFBench' && t[0]?.[3] === 'Alpaca');
    if (!t || t.length < 4) throw new Error('IFBench results table missing');
    const breakdown = tables.find(t => t[0]?.includes('IFB.') && t[0]?.includes('count'));
    const labels: Record<string, string> = { 'Tülu -DPO': 'tulu3DPO', 'IF-RLVR Tülu -DPO 8b': 'IF-RLVR (tulu3DPO)', 'IF-RLVR qwen2.5 7b': 'IF-RLVR (qwen2.5)' };
    const rows: LeaderboardRow[] = t.slice(1).map(r => {
      const match = breakdown?.find(c => c[0] === labels[r[0]] && c[2] === r[2]);
      const metrics: Record<string, number> = {};
      for (const k of ['count', 'format', 'words', 'sent.']) {
        const cell = match?.[breakdown![0].indexOf(k)];
        if (cell && Number.isFinite(Number(cell))) metrics[k] = Number(cell);
      }
      return { model: names[r[0]] ?? r[0], score: Number(r[2]), setting: 'single-turn, paper Table 3', metrics };
    });
    const training = tables.find(t => t[0]?.includes('DPO after SFT'));
    const strict = training?.find(r => r[0] === 'IFBench' && r[1] === 'strict');
    for (let i = 2; strict && training && i < strict.length; i++) {
      if (/^\d+(?:\.\d+)?$/.test(strict[i])) rows.push({ model: `IF training experiment (${training[0][i]})`, score: Number(strict[i]), setting: 'single-turn, paper Table 5' });
    }
    const fromBase = tables.find(t => t[0]?.includes('from base'));
    for (let i = 2; fromBase && i < fromBase.length; i++) {
      const cells = fromBase[i];
      if (cells[1] !== 'IFBench') continue;
      for (let col = 2; col < cells.length; col++) {
        if (!/^\d+(?:\.\d+)?$/.test(cells[col])) continue;
        const stage = fromBase[i - 1][0];
        const model = fromBase[1][col];
        rows.push({ model: `${stage} (${model}, ${fromBase[0][col]})`, score: Number(cells[col]), setting: 'single-turn, paper Table 6' });
      }
    }
    const turns = tables.find(t => t[0]?.includes('trained on single-turn'));
    for (const r of turns?.slice(3) ?? []) {
      for (let i = 1; i < r.length; i++) {
        if (turns![2][i] !== 'IFB.' || !/^\d+(?:\.\d+)?$/.test(r[i])) continue;
        rows.push({ model: `IF-RLVR (${r[0]}, ${turns![0][i]})`, score: Number(r[i]), setting: turns![1][i] });
      }
    }
    return rows;
  },
};
export default board;
