import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2503.10497';
const board: Leaderboard = {
  benchmark: 'mmlu-prox', parts: {
  EN: { name: 'English', group: 'Language' },
  FR: { name: 'French', group: 'Language' },
  DE: { name: 'German', group: 'Language' },
  ES: { name: 'Spanish', group: 'Language' },
  PT: { name: 'Portuguese', group: 'Language' },
  IT: { name: 'Italian', group: 'Language' },
  HI: { name: 'Hindi', group: 'Language' },
  BN: { name: 'Bengali', group: 'Language' },
  UR: { name: 'Urdu', group: 'Language' },
  TE: { name: 'Telugu', group: 'Language' },
  MR: { name: 'Marathi', group: 'Language' },
  NE: { name: 'Nepali', group: 'Language' },
  ZH: { name: 'Chinese', group: 'Language' },
  JA: { name: 'Japanese', group: 'Language' },
  KO: { name: 'Korean', group: 'Language' },
  VI: { name: 'Vietnamese', group: 'Language' },
  TH: { name: 'Thai', group: 'Language' },
  ID: { name: 'Indonesian', group: 'Language' },
  AR: { name: 'Arabic', group: 'Language' },
  AF: { name: 'Afrikaans', group: 'Language' },
  SW: { name: 'Swahili', group: 'Language' },
  WO: { name: 'Wolof', group: 'Language' },
  YO: { name: 'Yoruba', group: 'Language' },
  ZU: { name: 'Zulu', group: 'Language' },
  RU: { name: 'Russian', group: 'Language' },
  UK: { name: 'Ukrainian', group: 'Language' },
  SR: { name: 'Serbian', group: 'Language' },
  CS: { name: 'Czech', group: 'Language' },
  HU: { name: 'Hungarian', group: 'Language' },
}, url: URL, feed: URL + ' (full 29-language average table)', terms: PAPER_TERMS,
  aliases: {"Qwen3-235B": "qwen3-235b-a22b", "DeepSeek-R1-7B": "deepseek-r1-distill-qwen-7b", "DeepSeek-R1-14B": "deepseek-r1-distill-qwen-14b", "DeepSeek-R1-32B": "deepseek-r1-distill-qwen-32b", "DeepSeek-R1-70B": "deepseek-r1-distill-llama-70b", "Mistral-Small-3.1-24B": "mistral-small-3-1", "Phi4-mini-3.8B": "phi-4-mini", "Phi4-14B": "phi-4"},
  async fetch() {
    const html = await paperHtml(URL);
    const rows: { model: string; setting: string; score: number; metrics: Record<string, number> }[] = [];
    for (const figure of html.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)) {
      const caption = figure[0].match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1].replace(/<[^>]+>/g, ' ');
      if (!caption || !/MMLU-ProX (?:Lite )?(?:5-shot|zero-shot) Results/i.test(caption)) continue;
      const t = inlinePaperTables(figure[0]).find(t => t[0]?.[1] === 'Avg' && t[0]?.[2] === 'EN');
      if (!t) continue;
      const zero = /zero-shot/i.test(caption), lite = /Lite/i.test(caption);
      for (const r of t.slice(1)) {
        if (!r[0] || !r[1]?.trim() || !Number.isFinite(Number(r[1]))) continue;
        const setting = (zero ? 'zero-shot' : '5-shot CoT') + (r[0].endsWith('-Think') ? '; thinking' : /^Qwen3/.test(r[0]) ? '; non-thinking' : '');
        const model = paperModel(r[0].replace(/-Think$/, ''));
        const metrics = Object.fromEntries(r.slice(2).flatMap((cell, i) => cell.trim() && Number.isFinite(Number(cell)) ? [[t[0][i + 2], Number(cell)]] : []));
        if (lite) {
          const row = rows.find(row => row.model === model && row.setting === setting);
          if (row) {
            row.metrics.lite = Number(r[1]);
            board.parts!.lite = { name: 'MMLU-ProX Lite', group: 'Subset' };
            for (const [key, value] of Object.entries(metrics)) {
              row.metrics['lite:' + key] = value;
              board.parts!['lite:' + key] = { name: key, group: 'Lite language' };
            }
          }
        } else rows.push({ model, setting, score: Number(r[1]), metrics });
      }
    }
    if (!rows.length) throw new Error('MMLU-ProX full table missing');
    return rows;
  },
};
export default board;
