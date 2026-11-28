// EuroEval ranks European language models by rank score, lower first. The public CSV supplies the same table as the web bundle.
// Rows without a European rank score have results for only part of the board.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://euroeval.com/leaderboards-csv/european_all_models.csv";

function score(cell: string) {
  const m = cell?.trim().match(/^(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error('Invalid EuroEval score: ' + cell);
  return [Number(m[1]), Number(m[2])];
}

const board: Leaderboard = {
  benchmark: "euroeval",
  url: "https://euroeval.com/leaderboards/european",
  feed: FEED,
  terms: "The repository uses the MIT License for its software and documentation. The leaderboard does not specify separate data terms. https://github.com/EuroEval/EuroEval/blob/main/LICENSE",
  stats: {
    Context: { name: 'Context length', unit: 'tokens' },
    Vocabulary: { name: 'Vocabulary size', unit: 'tokens' },
  },
  aliases: {
    "Qwen/Qwen3.6-27B-FP8": "qwen3-6-27b",
    "Qwen/Qwen3.5-35B-A3B-FP8": "qwen3-5-35b-a3b",
    "mistralai/Mistral-Large-3-675B-Instruct-2512": "mistral-large-3",
    "mistralai/Mistral-Small-4-119B-2603": "mistral-small-4",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1",
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506": "mistral-small-3-2",
    "mistralai/Ministral-3-8B-Instruct-2512": "ministral-3-8b-instruct",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16": "nemotron-3-nano-30b-a3b",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-FP8": "nemotron-3-nano-30b-a3b",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-Base-BF16": "nemotron-3-nano-30b-a3b-base",
    "nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16": "nemotron-3-nano-4b",
    "nvidia/NVIDIA-Nemotron-3-Nano-4B-FP8": "nemotron-3-nano-4b"
  },
  async fetch() {
    const csv = await fetchText(FEED);
    const start = csv.indexOf('Rank,Model,Rank score,');
    if (start < 0) throw new Error('Missing EuroEval headers');
    const data = parseCsv(csv.slice(start));
    const keys = Object.keys(data[0]);
    const langs = keys.slice(keys.indexOf('Context') + 1);
    if (langs.length < 32 || !langs.includes('English') || !langs.includes('Ukrainian')) throw new Error('Missing EuroEval languages');
    this.parts = Object.fromEntries(langs.map(k => [k,{name:k,group:'Language',better:'lower'}]));
    const rows: LeaderboardRow[] = [];
    for (const r of data) {
      if (r['Rank score'] === '-') continue;
      const [mean, margin] = score(r['Rank score']);
      const label = text(r.Model);
      const [, model, effort, config] = label.match(/^([^#(]+?)(?:#([^ (]+))?(?: \(([^)]+)\))?$/) ?? [];
      if (!model) throw new Error('Unexpected EuroEval label: ' + label);
      const metrics: Record<string,number> = {};
      for (const lang of langs) {
        if (r[lang] === '-') continue;
        const [v, delta] = score(r[lang]);
        metrics[lang] = v;
        metrics[lang+'Ci'] = delta;
      }
      for (const key of ['Context','Vocabulary']) if (Number.isFinite(Number(r[key]))) metrics[key] = Number(r[key]);
      rows.push({ model: model.trim(), setting: [effort,config].filter(Boolean).join(', ') || undefined, score: mean, low: mean-margin, high: mean+margin, metrics, open: r.Open === '✓', params: Number(r.Parameters)/1e9 || undefined, link: r.Model.match(/href=['"]([^'"]+)/)?.[1] });
    }
    if (rows.length < 178) throw new Error('Expected at least 178 scored EuroEval configurations');
    return rows;
  },
};
export default board;
