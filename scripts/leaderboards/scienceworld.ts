// ScienceWorld measures an agent's progress on 30 elementary science tasks, from zero to one.
// Table 2 reports test performance by task. Table 5 gives whole-benchmark scores for additional pretrained models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://aclanthology.org/2022.emnlp-main.775.pdf';
const board: Leaderboard = {
  benchmark: 'scienceworld', url: 'https://aclanthology.org/2022.emnlp-main.775/', feed, static: 'paper',
  terms: 'The ACL Anthology publishes this EMNLP paper under its copyright policy. https://aclanthology.org/faq/copyright/',
  async fetch() {
    const paper = await pdfText(feed);
    const main = paper.match(/#\s+Topic\s+Task\s+Random-Valid\s+DRRN\s+KG-A2C\s+CALM\s+BC\s+TDT([\s\S]+?)Table 2: Zero-shot/)?.[1];
    const extra = paper.match(/C\.4\s+Impact of Model Size and Pre-training([\s\S]+?)Table 5: Average model performance/)?.[1];
    if (!main || !extra) throw Error('Missing ScienceWorld test tables');
    const base = main.match(/^\s*Average\s+([\d. ]+)$/m)?.[1].trim().split(/\s+/).map(Number);
    const details = main.split('\n').filter(s => /^\s*\d+-\d+\s/.test(s)).map(s => s.trim().split(/\s{2,}/));
    if (base?.length !== 6 || details.length !== 30 || !details.every(c => c.length === 9)) throw Error('Incomplete Table 2');
    board.parts = Object.fromEntries(details.map(c => [c[0], c[2].replace(/colours/g, 'colors')]));
    const names = ['DRRN', 'KG-A2C', 'CALM', 'Macaw-11B', 'Macaw-11B'];
    const settings = ['Online reinforcement learning', 'Online reinforcement learning', 'Online reinforcement learning', 'Behavior cloning', 'Decision Transformer'];
    const rows: LeaderboardRow[] = names.map((model, i) => ({
      model, setting: settings[i], score: base[i + 1], ...(i < 3 ? { trials: 5 } : {}),
      params: [0.0015, 0.0055, 0.131, 11, 11][i],
      metrics: Object.fromEntries(details.map(c => [c[0], Number(c[i+4])])),
    }));
    let setting = '';
    for (const line of extra.split('\n')) {
      if (line.trim() === 'Behavior Cloned') setting = 'Behavior cloning';
      if (line.trim() === 'Decision Transformer') setting = 'Decision Transformer';
      const m = line.match(/^\s*(T5-Large|Macaw-Large)\s+(0\.\d+)\s+770M\s*$/);
      if (m && setting) rows.push({ model: m[1], score: Number(m[2]), params: 0.77, setting });
    }
    return checked(rows, 9);
  },
};
export default board;
