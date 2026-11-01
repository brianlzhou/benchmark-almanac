// PolyMath. qwen-polymath.github.io is a static page with one leaderboard table (# | Model | Snapshot |
// Overall | 18 languages | Range): Overall, the difficulty-weighted accuracy over all 18 languages, is the
// score. A leading "*" marks reasoning models and is dropped. The table covers models released before
// 2025-05-01 and has not changed since. (The page also loads data/results/model_scores.js, a leftover
// MathVista table that it does not show.)
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://qwen-polymath.github.io/';

const board: Leaderboard = {
  benchmark: 'polymath',
  url: PAGE,
  feed: `${PAGE} (static HTML table, Overall)`,
  terms: 'Static GitHub Pages site that states no licence or terms; the PolyMath dataset card on Hugging Face is Apache-2.0.',
  aliases: {
    'Gemini-2.5-pro': 'gemini-2-5-pro-mar-2025',
    'Deepseek-R1': 'deepseek-r1',
    'OpenAI-o1': 'o1',
    'OpenAI-o1-mini': 'o1-mini',
    'Claude-3.7-sonnet-thinking': 'claude-3-7-sonnet',
    'Claude-3.7-sonnet': 'claude-3-7-sonnet',
    'Deepseek-v3-0324': 'deepseek-v3-mar-2025',
    'Deepseek-v3': 'deepseek-v3',
    'ChatGPT-4o-latest': 'gpt-4o-mar-2025',
    'GPT-4o': 'gpt-4o-nov-2024',
    'Gemini-2.0-flash-thinking': 'gemini-2-0-flash-thinking-jan-2025',
  },
  async fetch() {
    const [t] = tables(await fetchText(PAGE));
    const head = t?.[0]?.map((c) => c.text);
    if (!head || head[1] !== 'Model' || head[3] !== 'Overall') throw new Error(`unexpected PolyMath header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const score = num(r[3]?.text);
      let model = (r[1]?.text ?? '').replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
      const reasoning = model.startsWith('*');
      model = model.replace(/^\*\s*/, '');
      if (!model || score === undefined) continue;
      // "Claude-3.7-sonnet-thinking": the thinking mode of Claude 3.7 Sonnet
      const setting = reasoning && /-thinking$/i.test(model) && /claude/i.test(model) ? 'thinking' : undefined;
      const snapshot = /^\d{4}-\d\d-\d\d$/.test(r[2]?.text ?? '') ? r[2].text : undefined;
      rows.push({ model, score, setting, date: snapshot });
    }
    return rows;
  },
};
export default board;
