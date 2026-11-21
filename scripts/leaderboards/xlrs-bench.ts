// XLRS-Bench tests perception and reasoning on remote sensing images. Table 2 ranks models by average VQA accuracy in English and Chinese, and Tables 6 and 7 break it down further.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2503.23771';

const board: Leaderboard = {
  benchmark: 'xlrs-bench', static: 'paper',
  url: 'https://arxiv.org/abs/2503.23771',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Qwen2-VL": "qwen2-vl-7b-instruct", "LLaVA-OneVision": "llava-onevision-7b", "InternVL2": "internvl2-8b", "CogVLM2": "cogvlm2-llama3-chat-19b", "InternLM-XComposer-2.5": "internlm-xcomposer2-5-7b"},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const main = tables.find(t => t[1]?.[0] === 'Sub-tasks (L-2 Capability)' && t[2]?.at(-1) === 'Avg.');
    if (!main || main.length < 23 || main[0][2] !== 'Language') throw new Error('Incomplete XLRS results');
    const number = (value: string) => {
      const s = value.replace(/\s+/g, '');
      if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Invalid XLRS accuracy');
      return Number(s);
    };
    const rows: LeaderboardRow[] = main.slice(3).map(c => ({ model: c[0], setting: c[2], score: number(c.at(-1)!), metrics: {} }));
    board.parts = {};
    const record = (row: LeaderboardRow, name: string, group: string, value: string) => {
      const key = name.toLowerCase().replaceAll(' ', '_');
      board.parts![key] = { name, group };
      if (value.trim() && !/^[-–—]+$/.test(value.trim())) row.metrics![key] = number(value);
    };
    for (const [i, row] of rows.entries()) {
      for (let j = 3; j < main[1].length - 1; j++) {
        const name = [...new Set([main[1][j], main[2][j]])].join(' ');
        record(row, name, main[0][j], main[i+3][j]);
      }
    }
    for (const [first, group] of [['OC', 'Perception'], ['RP', 'Reasoning']]) {
      const detail = tables.find(t => t[1]?.[3] === first && t[1]?.at(-1) === 'Avg');
      if (!detail || detail.length !== rows.length + 2) throw new Error('Missing XLRS detail table');
      for (const c of detail.slice(2)) {
        const row = rows.find(r => r.model === c[0] && r.setting === c[2]);
        if (!row) throw new Error('Unknown XLRS detail model');
        for (let j = 3; j < detail[1].length; j++) record(row, j === detail[1].length-1 ? group : detail[1][j], group, c[j]);
      }
    }
    return rows;
  },
};
export default board;
