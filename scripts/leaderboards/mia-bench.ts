// MIA-Bench scores compliance with stacked image instructions. The paper gives a main Meta-Avg comparison, a judge comparison and two fine-tuning variants.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2407.01509';

const board: Leaderboard = {
  benchmark: 'mia-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2407.01509',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"LLaVA-1.5-7b": "llava-v1-5-7b", "LLaVA-1.5-13b": "llava-v1-5-13b", "LLaVA-NeXT-7b-vicuna": "llava-v1-6-vicuna-7b", "LLaVA-NeXT-13b-vicuna": "llava-v1-6-vicuna-13b", "XComposer2-7b": "internlm-xcomposer2-vl-7b", "CogVLM2": "cogvlm2-llama3-chat-19b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.[1] === 'Meta-Avg');
    const tuned = tables.find(t => t[0]?.[1] === 'Total Score');
    const judges = tables.find(t => t[1]?.[1] === 'Score' && t[1]?.[2] === 'Ranking');
    if (!main || !tuned || !judges || main[0].length !== 10 || judges[0].length !== 9) throw new Error('Missing MIA-Bench comparison');
    const number = (s: string) => { if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Invalid MIA-Bench score'); return Number(s); };
    const rows: LeaderboardRow[] = [];
    board.parts = {};
    const append = (c: string[], model: string, open: boolean, setting?: string) => {
      const metrics: Record<string, number> = {};
      for (let i = 2; i < main[0].length; i++) {
        const key = main[0][i];
        board.parts![key] = key;
        metrics[key] = number(c[i]);
      }
      rows.push({ model, open, setting, score: number(c[1]), metrics });
    };
    let open = true;
    for (const c of main.slice(1)) {
      if (c.every(v => v === c[0])) { open = /open/i.test(c[0]); continue; }
      append(c, c[0].replace(/\s*\( [^()]+, 20\d\d[a-z]? \)$/, ''), open);
    }
    for (const c of tuned.slice(2)) append(c, 'LLaVA-NeXT-13b ' + c[0], true);
    for (const c of judges.slice(2)) {
      for (let i = 1; i < judges[0].length; i += 2) rows.push({ model: c[0], setting: 'Judge: ' + judges[0][i], score: number(c[i]) });
    }
    if (rows.length < 63) throw new Error('Incomplete MIA-Bench results');
    return rows;
  },
};
export default board;
