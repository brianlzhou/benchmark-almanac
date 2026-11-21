// OrangeSum tests French news summarization. EuroEval reports chrF3++ and chrF4 on its held-out test split.
// The French generative leaderboard publishes both scores with uncertainty margins.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://euroeval.com/leaderboards/french';
export default {
  benchmark:'orangesum',url:feed,feed,host:'EuroEval',
  terms:'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  aliases: {
    "HuggingFaceTB/SmolLM2-135M": "smollm2-135m",
    "HuggingFaceTB/SmolLM2-360M": "smollm2-360m",
    "Qwen/Qwen3-0.6B": "qwen3-0-6b",
    "Qwen/Qwen3-4B-Thinking-2507": "qwen3-4b-thinking-2507",
    "allenai/Olmo-3.1-32B-Instruct": "olmo-3-1-32b-instruct",
    "google/gemma-3-12b-pt": "gemma-3-12b-pt",
    "google/gemma-3-1b-pt": "gemma-3-1b-pt",
    "google/gemma-3-270m": "gemma-3-270m-base",
    "google/gemma-3-27b-pt": "gemma-3-27b-pt",
    "google/gemma-3-4b-pt": "gemma-3-4b-pt",
    "meta-llama/Llama-3.3-70B-Instruct": "llama-3-3-70b-instruct",
    "mistralai/Ministral-3-3B-Reasoning-2512": "ministral-3-3b-reasoning",
    "nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16": "nemotron-3-nano-4b",
    "mistralai/Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1",
    "mistralai/Mistral-Small-3.2-24B-Instruct-2506": "mistral-small-3-2"
  },

  async fetch() {
    const page = await fetchText(feed);
    const script = page.match(/<script\b[^>]*src="([^"]*\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error('Missing EuroEval entry script');
    const url = new URL(script,feed);
    await new Promise(resolve => setTimeout(resolve,1000));
    const entry = await fetchText(url.href);
    const asset = entry.match(/"\/src\/frontend\/csv\/french_generative\.csv"[^}]{0,120}?import\(\x60([^\x60]+)\x60\)/)?.[1];
    if (!asset) throw new Error('Missing French CSV module');
    await new Promise(resolve => setTimeout(resolve,1000));
    const module = await fetchText(new URL(asset,url).href);
    const data = module.match(/\n(Rank,Model,[^\x60]+)\x60/);
    if (!data) throw new Error('Missing French leaderboard CSV');
    const records = parseCsv(data[1]);
    const key = Object.keys(records[0] ?? {}).find(k => text(k) === 'orange_sum');
    if (!key) throw new Error('Missing OrangeSum column');
    const rows = records.filter(r => r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model))).map(r => {
      const values = r[key].match(/^(-?[\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Malformed OrangeSum result');
      const [score,margin,f1,f1Margin] = values.slice(1).map(Number);
      const label = text(r.Model);
      const settings = label.match(/ \(([^()]+)\)$/);
      const [model,mode] = label.replace(/ \([^()]+\)$/,'').split('#');
      return {model,setting:[mode,settings?.[1]].filter(Boolean).join(', ') || undefined,
        score,low:score-margin,high:score+margin,link:r.Model.match(/href='([^']+)'/)?.[1],open:r.Open === '✓',
        metrics:{chrf4:f1,chrf4Low:f1-f1Margin,chrf4High:f1+f1Margin,scored:Number(r.orange_sum_scored),failures:Number(r.orange_sum_failures)}};
    });
    return checked(rows,81);
  },
} satisfies Leaderboard;
