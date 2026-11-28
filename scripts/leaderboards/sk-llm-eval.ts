// sk-llm-eval (Lubomir Tchurik): 207 original Slovak language quality tasks across 6 categories.
// Reads the public Hugging Face leaderboard Parquet config via the datasets-server JSON API.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://huggingface.co/datasets/lubomirtchurik/sk-llm-eval';
const FEED =
  'https://datasets-server.huggingface.co/rows?dataset=lubomirtchurik/sk-llm-eval&config=leaderboard&split=train&offset=0&length=100';

interface SkRow {
  model: string;
  overall: number;
  run_at?: string;
  cat_format?: number;
  cat_gramatika?: number;
  cat_long_text?: number;
  cat_preklad?: number;
  cat_realie?: number;
  cat_register?: number;
}

interface HfRowsResponse {
  num_rows_total: number;
  rows: Array<{ row: SkRow }>;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function splitModelSetting(raw: string): { model: string; setting?: string } {
  const trimmed = raw.trim();
  const paren = trimmed.match(/^(.+?)\s+\((agent|chat)\)$/i);
  if (paren) return { model: paren[1].trim(), setting: paren[2].toLowerCase() };
  const ctx = trimmed.match(/^(.+?)-32k$/i);
  if (ctx) return { model: ctx[1], setting: '32k' };
  const mtpQ = trimmed.match(/^(.+?)-mtp-(q\d+_\d+)$/i);
  if (mtpQ) return { model: mtpQ[1], setting: `mtp, ${mtpQ[2].toLowerCase()}` };
  const quant = trimmed.match(/^(.+?):(q\d+_\d+)$/i);
  if (quant) return { model: quant[1], setting: quant[2].toLowerCase() };
  return { model: trimmed };
}

const board: Leaderboard = {
  benchmark: 'sk-llm-eval',
  url: PAGE,
  feed: FEED,
  terms: 'Public MIT-licensed Hugging Face dataset (lubomirtchurik/sk-llm-eval) read via Hugging Face datasets-server.',
  aliases: {
    'mistralai/mistral-large-4-0': 'mistral-large-4',
    'qwen3.8:27b': 'qwen-3-8-27b',
    'laguna-xs-2.1': 'laguna-xs-2-1',
    'mistral-nemo:12b': 'mistral-nemo',
    'phi4-mini:3.8b': 'phi-4-mini',
  },
  parts: {
    gramatika: { name: 'Grammar', group: 'Category', note: 'Slovak declension, conjugation, and diacritics (69 tasks).' },
    realie: { name: 'Slovak facts', group: 'Category', note: 'Slovak history, geography, and institutional facts (47 tasks).' },
    format: { name: 'Format', group: 'Category', note: 'Slovak dates, numbers, and currency conventions (38 tasks).' },
    register: { name: 'Register', group: 'Category', note: 'Formal and informal address and tone (26 tasks).' },
    preklad: { name: 'Translation', group: 'Category', note: 'English to Slovak translation without anglicisms or Czech interference (14 tasks).' },
    longText: { name: 'Long text', group: 'Category', note: 'Coherent longer-form Slovak writing (13 tasks).' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const all: SkRow[] = [];
    let offset = 0;
    const length = 100;
    while (true) {
      const url = `https://datasets-server.huggingface.co/rows?dataset=lubomirtchurik/sk-llm-eval&config=leaderboard&split=train&offset=${offset}&length=${length}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
      if (!res.ok) throw new Error(`sk-llm-eval HF datasets-server: ${res.status}`);
      const data = (await res.json()) as HfRowsResponse;
      for (const item of data.rows ?? []) all.push(item.row);
      offset += data.rows?.length ?? 0;
      if (!data.rows?.length || offset >= data.num_rows_total) break;
    }

    const rows: LeaderboardRow[] = [];
    for (const r of all) {
      if (!r.model || typeof r.overall !== 'number') continue;
      const { model, setting } = splitModelSetting(r.model);
      const metrics: Record<string, number> = {};
      if (typeof r.cat_gramatika === 'number') metrics.gramatika = r2(r.cat_gramatika);
      if (typeof r.cat_realie === 'number') metrics.realie = r2(r.cat_realie);
      if (typeof r.cat_format === 'number') metrics.format = r2(r.cat_format);
      if (typeof r.cat_register === 'number') metrics.register = r2(r.cat_register);
      if (typeof r.cat_preklad === 'number') metrics.preklad = r2(r.cat_preklad);
      if (typeof r.cat_long_text === 'number') metrics.longText = r2(r.cat_long_text);

      const row: LeaderboardRow = {
        model,
        score: r2(r.overall),
        metrics,
      };
      if (setting) row.setting = setting;
      if (typeof r.run_at === 'string' && /^\d{4}-\d{2}-\d{2}/.test(r.run_at)) {
        row.date = r.run_at.slice(0, 10);
      }
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('sk-llm-eval: parsed zero rows');
    return rows;
  },
};

export default board;
