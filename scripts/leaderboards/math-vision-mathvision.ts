// MATH-Vision (MathVision), full 3,040-problem test set. mathllm.github.io/mathvision is a static page
// whose first table is the main leaderboard (# | Model | Source | Date | ALL | per-subject columns); the
// second is the open-source subset and the third is MATH-Vision-Wild. ALL is the score. Rows note
// "(3rd-party eval)" when MathVision's team did not run them; that note is dropped. Effort and tool use
// in the name ("(xhigh reasoning, w/ Python)") become the setting. Rows marked "(testmini)" used the
// 304-problem subset and are skipped, as are the human and random baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://mathllm.github.io/mathvision/';

/** "GPT-5.4 (xhigh reasoning, w/ Python) (3rd-party eval) 🥇" -> GPT-5.4, "xhigh, with python". */
function split(raw: string): { model: string; setting?: string } | null {
  let name = raw.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
  if (/\(testmini\)/i.test(name)) return null;
  name = name.replace(/\s*\((?:3rd-party eval[^)]*|contamination-flagged|\d{4}-\d\d-\d\d)\)/gi, '').trim();
  const settings: string[] = [];
  for (let m = name.match(/\s*\(([^()]*)\)$/); m; m = name.match(/\s*\(([^()]*)\)$/)) {
    if (!/\b(xhigh|high|medium|low|minimal|max|think|thinking|reasoning|python|tools)\b/i.test(m[1])) break;
    settings.unshift(
      m[1]
        .toLowerCase()
        .replace(/\b(reasoning|effort)\b/g, '')
        .replace(/w\/\s*/g, 'with ')
        .replace(/\bno think\b/, 'non-thinking')
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim(),
    );
    name = name.slice(0, m.index).trim();
  }
  return { model: name, setting: settings.join(', ') || undefined };
}

const board: Leaderboard = {
  benchmark: 'math-vision-mathvision',
  url: PAGE,
  feed: `${PAGE} (static HTML, main leaderboard table, ALL)`,
  terms: 'Static GitHub Pages site that states no licence or terms; the MATH-V repository is MIT.',
  aliases: {
    'Gemini 3.0 Flash': 'gemini-3-flash',
    'OpenAI o1': 'o1',
    'OpenAI o4-mini': 'o4-mini',
    // dated 2025-03-23 on the board: the March experimental release
    'Gemini 2.5 Pro': 'gemini-2-5-pro-mar-2025',
    'Claude 3.7 Sonnet': 'claude-3-7-sonnet',
    'Claude3.5-Sonnet': 'claude-3-5-sonnet',
    'Claude3-Opus': 'claude-3-opus',
    'Gemini-1.5 Pro': 'gemini-1-5-pro-may-2024',
    'Gemini Pro': 'gemini-1-0-pro',
    GPT4V: 'gpt-4v',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
    'LLaVA-OneVision-72B': 'llava-onevision-72b',
    'MiniCPM-V 2.6': 'minicpm-v-2-6',
    'MiniCPM-o 2.6': 'minicpm-o-2-6',
    'InternVL2.5-78B': 'internvl2-5-78b',
  },
  async fetch() {
    const [main] = tables(await fetchText(PAGE));
    const head = main?.[0]?.map((c) => c.text);
    if (!head || head[1] !== 'Model' || head[3] !== 'Date' || head[4] !== 'ALL') throw new Error(`unexpected MathVision header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of main.slice(1)) {
      const name = r[1]?.text ?? '';
      if (/^(Human|Random Chance)$/i.test(name)) continue;
      const score = num(r[4]?.text);
      const parsed = split(name);
      if (!parsed || score === undefined) continue;
      const date = /^\d{4}-\d\d-\d\d$/.test(r[3]?.text ?? '') ? r[3].text : undefined;
      rows.push({ ...parsed, score, date });
    }
    return rows;
  },
};
export default board;
