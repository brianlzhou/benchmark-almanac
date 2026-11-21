// K-Viscuit tests visual understanding of Korean culture. The paper reports overall accuracy and breaks down its main comparison by topic and question type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.16469';

const board: Leaderboard = {
  benchmark: 'k-viscuit', static: 'paper',
  url: 'https://arxiv.org/abs/2406.16469',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"InternLM-XC2-7B": "internlm-xcomposer2-vl-7b", "LLaVA-1.6-13B": "llava-v1-6-vicuna-13b", "LLaVA-1.6-7B": "llava-v1-6-vicuna-7b", "Llama-3.2-11B": "llama-3-2-11b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[0]?.slice(0,4).join('|') === 'Model|All|Food|Beverage');
    const types = tables.find(t => t[0]?.join('|') === 'Model|Type 1|Type 2|All');
    const langs = tables.find(t => t[0]?.[1] === 'en' && t[0][2]?.startsWith('ko'));
    if (!main || !types || !langs || main.length < 14 || langs.length < 5) throw new Error('Missing K-Viscuit comparisons');
    const number = (s: string) => { if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Invalid K-Viscuit score'); return Number(s); };
    const rows: LeaderboardRow[] = [];
    board.parts = { type1: 'Type 1', type2: 'Type 2' };
    for (const c of main.slice(1)) {
      const model = c[0].split(' (')[0];
      const other = types.find(r => r[0].toLowerCase() === model.toLowerCase());
      if (!other) throw new Error('Missing K-Viscuit question types for ' + model);
      const metrics: Record<string, number> = { type1: number(other[1]), type2: number(other[2]) };
      main[0].slice(2).forEach((name, i) => { board.parts![name] = name; metrics[name] = number(c[i+2]); });
      rows.push({ model, setting: 'en', score: number(c[1]), metrics });
    }
    for (const c of langs.slice(1)) {
      for (const i of [2,3]) rows.push({ model: c[0], setting: langs[0][i].replace(' ∗',''), score: number(c[i]) });
    }
    return rows;
  },
};
export default board;
