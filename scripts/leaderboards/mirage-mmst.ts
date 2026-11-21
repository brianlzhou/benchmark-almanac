// MIRAGE-MMST grades single-turn agricultural consultations. The official standard leaderboard
// reads a JSON table and ranks models by its Overall column.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://mirage-benchmark.github.io/leaderboards/MMST_Standard.json";
const board: Leaderboard = {
  benchmark: 'mirage-mmst',
  url: "https://mirage-benchmark.github.io/#MIRAGE-MMST",
  feed,
  terms: "The site serves no robots.txt directives. CC BY-SA 4.0 covers the website template. The authors give no separate leaderboard license.",
  aliases: {
    'Llama 4 Scout 17B 16E Inst': 'llama-4-scout', 'Llava V1.6 Mistral 7B HF': 'llava-v1-6-mistral-7b',
    'Llava Onevision QWEN2 7B OV': 'llava-onevision-7b',
    'Qwen2.5-VL 3B Inst': 'qwen2-5-vl-3b', 'Qwen2.5-VL 7B Inst': 'qwen2-5-vl-7b', 'Qwen2.5-VL 32B Inst': 'qwen2-5-vl-32b', 'Qwen2.5-VL 72B Inst': 'qwen2-5-vl-72b'
  },
  parts: { id_ws: 'Identification weighted score', mg_ws: 'Management weighted score',
    id_acc_pct: 'Identification accuracy', id_reason: 'Identification reasoning', mg_acc: 'Management accuracy',
    mg_rel: 'Management relevance', mg_comp: 'Management completeness', mg_pars: 'Management parsimony' },
  async fetch() {
    const rows = await fetchJson<(Record<string, number> & {model: string; group: string; date: string})[]>(feed);
    if (rows.length < 22) throw new Error('Missing MIRAGE-MMST rows');
    return rows.map(r => {
      const metrics = Object.fromEntries(Object.keys(board.parts!).map(key => [key, r[key]]));
      if (!r.model || ![r.overall, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid MIRAGE-MMST scores');
      return { model: r.model, score: r.overall, metrics, date: r.date, open: r.group === 'open' };
    });
  },
};
export default board;
