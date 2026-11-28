// ČSFD tests sentiment classification in Czech movie reviews. EuroEval publishes scores for its ČSFD-mini test split.
// The Czech board reports Matthews correlation first, then macro F1, both scaled by 100.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://euroeval.com/leaderboards-csv/czech_all_models.csv';
export default {
  benchmark:'csfd-sentiment',url:'https://euroeval.com/leaderboards/czech',feed,host:'EuroEval',
  terms:'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  aliases: {
    "CohereLabs/aya-expanse-8b": "aya-expanse-8b",
    "HuggingFaceTB/SmolLM2-135M": "smollm2-135m",
    "HuggingFaceTB/SmolLM2-360M": "smollm2-360m",
    "meta-llama/Llama-3.3-70B-Instruct": "llama-3-3-70b-instruct",
    "google/gemma-3-12b-pt": "gemma-3-12b-pt",
    "google/gemma-3-1b-pt": "gemma-3-1b-pt",
    "google/gemma-3-27b-pt": "gemma-3-27b-pt",
    "google/gemma-3-4b-pt": "gemma-3-4b-pt",
    "allenai/OLMo-2-0325-32B-Instruct": "olmo-2-32b-instruct",
    "Qwen/Qwen3-0.6B": "qwen3-0-6b",
    "google/gemma-3n-E2B-it": "gemma-3n-e2b",
    "LGAI-EXAONE/EXAONE-4.0-32B": "exaone-4-0-32b",
    "arcee-ai/AFM-4.5B": "afm-4-5b",
    "Qwen/Qwen3-4B-Thinking-2507": "qwen3-4b-thinking-2507",
    "google/gemma-3-270m": "gemma-3-270m-base",
    "swiss-ai/Apertus-70B-Instruct-2509": "apertus-70b",
    "swiss-ai/Apertus-8B-Instruct-2509": "apertus-8b",
    "ibm-granite/granite-4.0-h-small": "granite-4-0-h-small",
    "arcee-ai/Trinity-Mini": "trinity-mini",
    "mistralai/Ministral-3-14B-Reasoning-2512": "ministral-3-14b",
    "mistralai/Ministral-3-3B-Instruct-2512": "ministral-3-3b-instruct",
    "mistralai/Ministral-3-3B-Reasoning-2512": "ministral-3-3b-reasoning",
    "mistralai/Ministral-3-8B-Instruct-2512": "ministral-3-8b-instruct",
    "allenai/Olmo-3.1-32B-Instruct": "olmo-3-1-32b-instruct",
    "allenai/Olmo-3.1-32B-Think": "olmo-3-1-32b-think",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16": "nemotron-3-nano-30b-a3b",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-Base-BF16": "nemotron-3-nano-30b-a3b-base",
    "zai-org/GLM-4.7-Flash": "glm-4-7-flash",
    "CohereLabs/tiny-aya-global": "tiny-aya-global",
    "CohereLabs/tiny-aya-water": "tiny-aya-water",
    "Qwen/Qwen3.5-35B-A3B-Base": "qwen3-5-35b-a3b-base",
    "Qwen/Qwen3.5-9B-Base": "qwen3-5-9b-base",
    "Qwen/Qwen3.5-4B-Base": "qwen3-5-4b-base",
    "Qwen/Qwen3.5-0.8B-Base": "qwen3-5-0-8b-base",
    "Qwen/Qwen3.5-2B-Base": "qwen3-5-2b-base",
    "nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16": "nemotron-3-nano-4b",
    "nvidia/Nemotron-Cascade-2-30B-A3B": "nemotron-cascade-2-30b-a3b",
    "google/gemma-4-E2B": "gemma-4-e2b-base",
    "google/gemma-4-E2B-it": "gemma-4-e2b-it",
    "google/gemma-4-E4B": "gemma-4-e4b-base",
    "google/gemma-4-E4B-it": "gemma-4-e4b-it",
    "google/gemma-4-12B-it": "gemma-4-12b-it",
    "swiss-ai/Apertus-v1.5-70B": "apertus-1-5-70b",
    "swiss-ai/Apertus-v1.5-8B": "apertus-1-5-8b",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1",
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506": "mistral-small-3-2"
},
  headline:'EuroEval reports Matthews correlation on its ČSFD-mini test split, scaled by 100.',
  stats: {
    macroF1: { name: 'Macro F1', unit: '%', better: 'higher' },
  },
  async fetch() {
    const csv = await fetchText(feed);
    const header = csv.indexOf('Rank,Model,');
    if (header < 0) throw new Error('Missing Czech leaderboard header');
    const records = parseCsv(csv.slice(header));
    const key = Object.keys(records[0] ?? {}).find(k => text(k) === 'csfd_sentiment');
    if (!key) throw new Error('Missing ČSFD column');
    const rows = records.filter(r => r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model))).map(r => {
      const values = r[key].match(/^(-?[\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Malformed ČSFD result');
      const [score,margin,f1,f1Margin] = values.slice(1).map(Number);
      const label = text(r.Model);
      const settings = label.match(/ \(([^()]+)\)$/);
      const [model,mode] = label.replace(/ \([^()]+\)$/,'').split('#');
      return {model,setting:[mode,settings?.[1]].filter(Boolean).join(', ') || undefined,
        score,low:score-margin,high:score+margin,link:r.Model.match(/href='([^']+)'/)?.[1],open:r.Open === '✓',
        metrics:{macroF1:f1,macroF1Low:f1-f1Margin,macroF1High:f1+f1Margin}};
    });
    return checked(rows,168);
  },
} satisfies Leaderboard;
