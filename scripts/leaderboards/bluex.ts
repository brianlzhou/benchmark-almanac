// BLUEX tests knowledge on Brazilian university entrance exams. The Open Portuguese LLM Leaderboard
// reports three-shot accuracy on 724 text-only questions. Its archive includes model revisions and precision.
import type { Leaderboard } from './types.ts';
import portuguese from './open-portuguese-llm-leaderboard.ts';
import { gunzipSync } from 'node:zlib';
import { fetchBytes, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const board: Leaderboard = {
  benchmark: 'bluex', host: 'Open Portuguese LLM Leaderboard', url: portuguese.url,
  feed: portuguese.feed, terms: portuguese.terms, aliases: { ...portuguese.aliases,
    'Gemini 2.5 Pro Experimental (0325)': 'gemini-2-5-pro-mar-2025',
    'Gemini 2.0 Flash Lite (001)': 'gemini-2-0-flash-lite',
    'Qwen/Qwen2.5-VL-32B-Instruct (API)': 'qwen2-5-vl-32b' },
  async fetch() {
    const table = parseCsv(gunzipSync(await fetchBytes(portuguese.feed)).toString('utf8'));
    if (!table[0] || !['bluex','flagged','source','display_name','date','precision'].every(k => k in table[0])) throw new Error('Missing BLUEX columns');
    const rows = table.filter(r => r.source !== 'baseline' && r.flagged !== 'True').map(r => {
      const model = r.hf_path || r.display_name.replace(/\s*\[\d{4}-\d\d-\d\d\]$/,'').replace(/\s*\[reasoning[^\]]*\]/i,'').trim();
      const setting = ['Three-shot, text-only', r.display_name.match(/\[(reasoning[^\]]*)\]/i)?.[1],
        r.display_name.match(/\((rev: [^)]+)\)/)?.[1], r.precision !== '?' && r.precision, r.date].filter(Boolean).join(', ');
      const score = Number(r.bluex);
      if (!r.bluex.trim() || !Number.isFinite(score) || score < 0 || score > 100) throw new Error('Invalid BLUEX accuracy');
      return { model, setting, score, date: r.date, params: Number(r.params) || undefined,
        link: r.details_url || r.link || undefined, license: r.license !== '?' ? r.license : undefined };
    });
    return checked(rows, 1253);
  },
};
export default board;
