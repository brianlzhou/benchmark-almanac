// ScienceQA. scienceqa.github.io/leaderboard.html builds its table from javascript/leaderboard-data.js, a
// plain array assignment (`leaderboard = [...]`) of JSON objects. The headline is Avg, test accuracy over all
// questions. Most entries are 2022 to 2024 research systems (Multimodal-CoT, LLaVA variants); only plain
// models in data/models.json match. Rows carry the entry's Date (the method's publication date), and the
// human and random baselines and entries without an Avg are dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://scienceqa.github.io/leaderboard.html';
const FEED = 'https://scienceqa.github.io/javascript/leaderboard-data.js';

interface Entry {
  Model: string;
  Date?: string;
  Avg?: string;
  Size?: string;
  Link?: string;
  NAT?: string;
  SOC?: string;
  LAN?: string;
  TXT?: string;
  IMG?: string;
  NO?: string;
  'G1-6'?: string;
  'G7-12'?: string;
}

const board: Leaderboard = {
  benchmark: 'scienceqa',
  url: PAGE,
  feed: `${FEED} (Avg over all questions)`,
  terms: 'Static file on the project GitHub Pages site (no robots.txt); the ScienceQA repository is MIT-licensed.',
  aliases: {
    'LLaMA1-13B': 'llama-13b',
    'LLaMA1-7B': 'llama-7b',
    'LLaVA-1.5 (Vicuna-13B)': 'llava-v1-5-13b',
    'LLaVA-1.5 (Vicuna-7B)': 'llava-v1-5-7b',
    'Qwen-VL-Chat (Qwen-7B)': 'qwen-vl-chat',
    'InstructBLIP (Vicuna-13B)': 'instructblip-vicuna-13b',
    'InstructBLIP (Vicuna-7B)': 'instructblip-vicuna-7b',
  },
  parts: {
    nat: { name: 'Natural science', group: 'Subject' },
    soc: { name: 'Social science', group: 'Subject' },
    lan: { name: 'Language science', group: 'Subject' },
    txt: { name: 'Text context', group: 'Context' },
    img: { name: 'Image context', group: 'Context' },
    no: { name: 'No context', group: 'Context' },
    g1to6: { name: 'Grades 1 to 6', group: 'Grade' },
    g7to12: { name: 'Grades 7 to 12', group: 'Grade' },
  },
  async fetch() {
    const src = await fetchText(FEED);
    const list = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1)) as Entry[];
    const rows: LeaderboardRow[] = [];
    for (const e of list) {
      const model = e.Model.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const score = Number(e.Avg);
      if (!model || !Number.isFinite(score) || /^(human performance|random chance)$/i.test(model)) continue;
      const d = e.Date?.match(/^(\d\d)-(\d\d)-(\d\d)$/);
      const size = e.Size?.match(/^([\d.]+)([MB])$/);
      const metrics: Record<string, number> = {};
      for (const [col, key] of [
        ['NAT', 'nat'], ['SOC', 'soc'], ['LAN', 'lan'],
        ['TXT', 'txt'], ['IMG', 'img'], ['NO', 'no'],
        ['G1-6', 'g1to6'], ['G7-12', 'g7to12'],
      ] as const) {
        const v = Number(e[col]);
        if (Number.isFinite(v)) metrics[key] = v;
      }
      rows.push({
        model,
        score,
        params: size ? Number(size[1]) / (size[2] === 'M' ? 1000 : 1) : undefined,
        link: /^https:\/\/(?:arxiv.org|aclanthology.org)\//.test(e.Link ?? '') ? e.Link : undefined,
        ...(d ? { date: `20${d[1]}-${d[2]}-${d[3]}` } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (rows.length < 50) throw new Error(`only ${rows.length} ScienceQA rows`);
    return rows;
  },
};
export default board;
