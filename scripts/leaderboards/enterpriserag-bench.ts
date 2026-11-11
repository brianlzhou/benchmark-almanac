// Official leaderboard CSV. RAG systems remain products unless the evaluated model is explicit.
// Keep every published row, including one-shot baselines, with its setting.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const FEED = 'https://huggingface.co/spaces/onyx-dot-app/EnterpriseRAG-Bench-Leaderboard/raw/main/data/final_display_data/leaderboard.csv';
const board: Leaderboard = {
  benchmark: 'enterpriserag-bench', url: 'https://huggingface.co/spaces/onyx-dot-app/EnterpriseRAG-Bench-Leaderboard', feed: FEED,
  terms: 'Public official Hugging Face leaderboard data. The almanac credits Onyx and links the source.',
  async fetch() {
    const data = parseCsv(await fetchText(FEED));
    if (!data.length) throw new Error('EnterpriseRAG rows missing');
    return data.map(r => {
      const score = Number(r.overall_score);
      if (!r.model || !Number.isFinite(score)) throw new Error('Invalid EnterpriseRAG row');
      const named = r.model.match(/\(\+ (GPT-6\.1 Sol|Opus 5)\)/);
      return { model: named ? (named[1] === 'Opus 5' ? 'Claude Opus 5' : named[1]) : r.model + ' (RAG system)',
        harness: r.model, setting: r.tags || undefined, score,
        metrics: Object.fromEntries(['correctness','completeness','recall','invalid_extra_docs'].map(k => [k, Number(r[k])])) };
    });
  },
};
export default board;
