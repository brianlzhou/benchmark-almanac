// KOR-Bench (knowledge-orthogonal reasoning) on kor-bench.github.io. The leaderboard table is filled from
// static/data/kor_leaderboard_data.json: per model the overall accuracy (0 to 100, a string), five
// category scores, the evaluation date and a type. Both chat and base-model configurations are retained,
// with the type in setting. Base names are kept distinct from instruction-tuned registry entries. A snapshot date in the name
// ("O1-Preview(2024-09-12)") becomes the row date so the resolver picks that snapshot.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://kor-bench.github.io/static/data/kor_leaderboard_data.json';

interface Entry {
  model?: string;
  date?: string;
  overall?: string | number;
  type?: string;
  size?: string;
  open?: boolean;
  link?: string;
  operation?: string | number;
  logic?: string | number;
  cipher?: string | number;
  puzzle?: string | number;
  counterfactual?: string | number;
}

const board: Leaderboard = {
  benchmark: 'kor-bench',
  parts: {
    cipher: { name: 'Cipher', group: 'Task type' },
    counterfactual: { name: 'Counterfactual', group: 'Task type' },
    operation: { name: 'Operation', group: 'Task type' },
    logic: { name: 'Logic', group: 'Task type' },
    puzzle: { name: 'Puzzle', group: 'Task type' },
  },
  url: 'https://kor-bench.github.io/',
  feed: `${FEED} (chat and base models)`,
  terms: 'Static JSON on a GitHub Pages project site with no robots.txt and no terms; the KOR-Bench repository is public and the scores are cited to the authors.',
  aliases: {
    'Meta-Llama-3.1-405B-Instruct': 'llama-3-1-405b',
    'Meta-Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'Meta-Llama-3-70B-Instruct': 'llama-3-70b',
    'Qwen2.5-32B-Instruct': 'qwen2-5-32b',
    'Qwen2.5-14B-Instruct': 'qwen2-5-14b',
    'Mistral-Large-Instruct-2407': 'mistral-large-2-jul-2024',
    'Gemma-2-27b-It': 'gemma-2-27b',
    'Gemma-2-9b-It': 'gemma-2-9b',
    'Gemini-1.5-Pro-001': 'gemini-1-5-pro-may-2024',
    'Yi-1.5-34B-Chat': 'yi-1-5-34b',
    'Phi-3.5-mini-Instruct': 'phi-3-5-mini',
    'Qwen2.5-7B-Instruct': 'qwen2-5-7b',
    'Meta-Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Meta-Llama-3-8B-Instruct': 'llama-3-8b',
    'Mistral-7B-Instruct-v0.3': 'mistral-7b-v0-3',
    // the registry's Command R+ record is the 08-2024 release
    'C4ai-Command-R-Plus-08-2024': 'command-r-plus',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const e of await fetchJson<Entry[]>(FEED)) {
      if (!e.model || e.overall === '' || e.overall == null) continue;
      const score = Number(e.overall);
      if (!Number.isFinite(score)) continue;
      let model = e.model.trim();
      const date = e.date;
      const snap = model.match(/\s*\((\d{4}-\d\d-\d\d)\)$/);
      if (snap) {
        model = model.slice(0, snap.index).trim();
      }
      if (e.type && e.type !== 'chat model') model += ' (base)';
      const metrics: Record<string, number> = {};
      for (const [key, value] of [['operation', e.operation], ['logic', e.logic], ['cipher', e.cipher], ['puzzle', e.puzzle]] as const) {
        const n = Number(value);
        if (Number.isFinite(n)) metrics[key] = n;
      }
      const counter = String(e.counterfactual ?? '').match(/^([\d.]+)(?:\(([\d.]+)\))?$/);
      if (counter) {
        metrics.counterfactual = Number(counter[1]);
        if (counter[2]) metrics.counterfactualStd = Number(counter[2]);
      }
      const params = String(e.size ?? '').match(/^(\d+(?:\.\d+)?)B$/i)?.[1];
      const link = e.link?.trim();
      rows.push({ model, score, date, setting: e.type ?? 'chat model',
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(params ? { params: Number(params) } : {}),
        ...(typeof e.open === 'boolean' ? { open: e.open } : {}),
        metrics });
    }
    if (!rows.length) throw new Error('no chat-model rows in the KOR-Bench data');
    return rows;
  },
};
export default board;
