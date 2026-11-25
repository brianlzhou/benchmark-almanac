// Hotter and Colder tests sentiment classification in Icelandic blog text. EuroEval publishes the sentiment test scores.
// The Icelandic board reports Matthews correlation first, then macro F1, both scaled by 100.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://euroeval.com/leaderboards/icelandic';
export default {
  benchmark:'hotter-and-colder',url:feed,feed,host:'EuroEval',
  terms:'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  stats:{macroF1:{name:'Macro F1',unit:'%',better:'higher'},scored:{name:'Scored runs',unit:'count'},failures:{name:'Failed runs',unit:'count',better:'lower'}},
  aliases: {
    "google/gemma-3-27b-pt": "gemma-3-27b-pt",
    "Qwen/Qwen3-Next-80B-A3B-Instruct": "qwen3-next-80b-a3b-instruct",
    "google/gemma-3-12b-pt": "gemma-3-12b-pt",
    "swiss-ai/Apertus-70B-Instruct-2509": "apertus-70b",
    "swiss-ai/Apertus-8B-Instruct-2509": "apertus-8b",
    "allenai/Llama-3.1-Tulu-3-8B": "llama-3-1-tulu-3-8b",
    "allenai/OLMo-2-0325-32B-Instruct": "olmo-2-32b-instruct",
    "Qwen/Qwen3-4B-Thinking-2507": "qwen3-4b-thinking-2507",
    "allenai/Olmo-3.1-32B-Instruct": "olmo-3-1-32b-instruct",
    "google/gemma-3-4b-pt": "gemma-3-4b-pt",
    "meta-llama/Llama-2-70b-hf": "llama-2-70b",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16": "nemotron-3-nano-30b-a3b",
    "ibm-granite/granite-3.0-8b-base": "granite-3-0-8b-base",
    "ibm-granite/granite-3.0-8b-instruct": "granite-3-0-8b-instruct",
    "mistralai/Ministral-3-3B-Reasoning-2512": "ministral-3-3b-reasoning",
    "google/gemma-2-2b-it": "gemma-2-2b-it",
    "arcee-ai/AFM-4.5B": "afm-4-5b",
    "nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16": "nemotron-3-nano-4b",
    "microsoft/Phi-4-reasoning": "phi-4-reasoning",
    "google/gemma-3-1b-pt": "gemma-3-1b-pt",
    "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B": "deepseek-r1-distill-qwen-7b",
    "Qwen/Qwen3-0.6B": "qwen3-0-6b",
    "HuggingFaceTB/SmolLM2-1.7B-Instruct": "smollm2-1-7b-instruct",
    "HuggingFaceTB/SmolLM2-1.7B": "smollm2-1-7b",
    "microsoft/Phi-4-mini-reasoning": "phi-4-mini-reasoning",
    "google/gemma-3-270m": "gemma-3-270m-base",
    "HuggingFaceTB/SmolLM2-360M": "smollm2-360m",
    "HuggingFaceTB/SmolLM2-135M": "smollm2-135m",
    "Nexusflow/Starling-LM-7B-beta": "starling-lm-7b-beta",
    "RekaAI/reka-flash-3.1": "reka-flash-3-1",
    "google/gemma-3n-E2B-it": "gemma-3n-e2b",
    "ibm-granite/granite-4.0-h-small": "granite-4-0-h-small",
    "mistralai/Mistral-7B-Instruct-v0.1": "mistral-7b-instruct-v0-1",
    "mistralai/Mistral-7B-Instruct-v0.2": "mistral-7b-instruct-v0-2",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1",
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506": "mistral-small-3-2"
},
  headline:'EuroEval reports Matthews correlation on its Hotter and Colder sentiment test split, scaled by 100.',
  async fetch() {
    const page = await fetchText(feed);
    const script = page.match(/<script\b[^>]*src="([^"]*\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error('Missing EuroEval entry script');
    const url = new URL(script,feed);
    await new Promise(resolve => setTimeout(resolve,1000));
    const entry = await fetchText(url.href);
    const asset = entry.match(/"\/src\/frontend\/csv\/icelandic_all_models\.csv"[^}]{0,120}?import\(\x60([^\x60]+)\x60\)/)?.[1];
    if (!asset) throw new Error('Missing Icelandic CSV module');
    await new Promise(resolve => setTimeout(resolve,1000));
    const module = await fetchText(new URL(asset,url).href);
    const data = module.match(/\n(Rank,Model,[^\x60]+)\x60/);
    if (!data) throw new Error('Missing Icelandic leaderboard CSV');
    const records = parseCsv(data[1]);
    const key = Object.keys(records[0] ?? {}).find(k => text(k) === 'hotter_and_colder_sentiment');
    if (!key) throw new Error('Missing Hotter and Colder column');
    const rows = records.filter(r => r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model))).map(r => {
      const values = r[key].match(/^(-?[\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Malformed Hotter and Colder result');
      const [score,margin,f1,f1Margin] = values.slice(1).map(Number);
      const label = text(r.Model);
      const settings = label.match(/ \(([^()]+)\)$/);
      const [model,mode] = label.replace(/ \([^()]+\)$/,'').split('#');
      return {model,setting:[mode,settings?.[1]].filter(Boolean).join(', ') || undefined,
        score,low:score-margin,high:score+margin,link:r.Model.match(/href='([^']+)'/)?.[1],open:r.Open === '✓',
        metrics:{macroF1:f1,macroF1Low:f1-f1Margin,macroF1High:f1+f1Margin,scored:Number(r.hotter_and_colder_sentiment_scored),failures:Number(r.hotter_and_colder_sentiment_failures)}};
    });
    // EuroEval drops a model now and then (358 rows on 2026-11-20, 357 on 2026-11-24), so the floor only catches a
    // broken parse, not a source that removed a row
    return checked(rows,330);
  },
} satisfies Leaderboard;
