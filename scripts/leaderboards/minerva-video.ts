import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2505.00681';
const clean = (s: string) => s.replace(/\s*\[\s*\d+\s*\]/g, '').trim();
const names: Record<string, string> = {'Qwen2.5-VL': 'Qwen2.5-VL-72B', 'VideoLLaMA3': 'VideoLLaMA3-7B', 'Claude3.5 Sonnet v2': 'claude-3-5-sonnet-20241022', 'GPT-4o': 'gpt-4o-2024-08-06'};
const board: Leaderboard = {
  benchmark: 'minerva-video', url: URL, feed: URL + ' (Table 4 MCQ accuracy, Table 8 settings, Table 9 reasoning metrics)', terms: PAPER_TERMS,
  aliases: {'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024'},
  async fetch() {
    const ts = inlinePaperTables(await paperHtml(URL));
    const t = ts.find(t => t[0]?.[1] === '# Frames' && t[0]?.[3] === 'MCQ-Acc. %');
    const configs = ts.find(t => t[0]?.[3]?.startsWith('Hyperparameters'));
    const reasoning = ts.find(t => t[0]?.[4] === 'MiRA' && t.length > 10);
    if (!t || !configs || !reasoning) throw new Error('Minerva tables missing');
    return t.slice(1).filter(r => /^\d/.test(r[3]) && !/Random|Human/.test(r[0])).map(r => {
      const raw = clean(r[0]); const model = names[raw] ?? paperModel(raw.replace(/^OpenAI /, '').replace(/ Thinking$/, ''));
      const config = configs.find(c => clean(c[0]).replace(/ /g, '') === (names[raw] ?? raw).replace(/ /g, ''));
      const sub = reasoning.find(c => clean(c[0]) === raw);
      const metrics = sub ? Object.fromEntries(sub.slice(4).map((v, i) => ['MiRA_' + reasoning[1][i + 4], Number(v)])) : {};
      return {model, score: Number(r[3]), setting: `frames ${r[1]}; ASR ${r[2]}${/Thinking/.test(raw) ? '; thinking' : ''}${config ? '; ' + config[3] : ''}`, metrics};
    });
  },
};
export default board;
