// KRETA (Korean text-rich visual question answering, EMNLP 2025). The makers keep the board in the
// tabtoyou/KRETA README: a short markdown table and, under "Full Leaderboard", an HTML table with every
// model. The full table is read, with "Overall" (accuracy, 0 to 100) as the score. A closed model's name
// ends in its snapshot date as "(YY.MM.DD)", which becomes the row date, and a size such as "(7B)" is folded
// into the name ("Qwen2.5-VL 7B").
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { ghRaw } from './big-bench-extra-hard.ts';

const REPO = 'tabtoyou/KRETA';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'kreta',
  url: `https://github.com/${REPO}`,
  feed: `${FEED} (Full Leaderboard, Overall)`,
  terms: 'README table in the tabtoyou/KRETA GitHub repository, which states no license; scores are cited to the KRETA authors.',
  aliases: {
    // the board dates this row 24.10.22, the October 2024 model, which the registry names apart
    'Claude-3.5-Sonnet': 'claude-3-5-sonnet-october-2024',
    'Qwen2.5-VL 3B': 'qwen2-5-vl-3b',
    'Qwen2.5-VL 7B': 'qwen2-5-vl-7b',
    'InternVL2.5 8B': 'internvl2-5-8b',
    'InternVL2.5 4B': 'internvl2-5-4b',
    'LLaVA-OneVision 7B': 'llava-onevision-7b',
    'LLaVA-OneVision 0.5B': 'llava-onevision-0-5b',
    'Deepseek-VL2-small 2.8B': 'deepseek-vl2-small',
    'Deepseek-VL2-tiny 1B': 'deepseek-vl2-tiny',
    'Phi-3.5-Vision 4.2B': 'phi-3-5-vision-instruct',
    'MiniCPM-V-2.6 8B': 'minicpm-v-2-6',
    'MiniCPM-o-2.6 8B': 'minicpm-o-2-6',
  },
  async fetch() {
    const t = tables(await fetchText(FEED)).find((x) => x[0]?.[0]?.text === 'Models' && x[0].some((c) => c.text === 'Overall'));
    if (!t) throw new Error('KRETA full leaderboard not found');
    const iScore = t[0].findIndex((c) => c.text === 'Overall');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      let model = r[0]?.text ?? '';
      const score = num(r[iScore]?.text);
      if (!model || score === undefined) continue;
      let date: string | undefined;
      const stamp = model.match(/\s*\((\d\d)\.\s*(\d\d)\.\s*(\d\d)\)$/);
      if (stamp) {
        date = `20${stamp[1]}-${stamp[2]}-${stamp[3]}`;
        model = model.slice(0, stamp.index);
      }
      model = model.replace(/\s*\(([\d.]+B)\)/i, ' $1').trim();
      rows.push({ model, score, date });
    }
    return rows;
  },
};
export default board;
