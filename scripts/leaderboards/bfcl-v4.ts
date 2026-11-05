// Berkeley Function Calling Leaderboard. gorilla.cs.berkeley.edu/leaderboard.html loads data_overall.csv
// (BFCL V4, the only version the page shows; "Last Updated" 2026-04-12 at the time of writing). The
// headline is "Overall Acc", a percentage string. Each model name ends in its calling mode: "(FC)" for
// native function calling or "(Prompt)" for prompted calls, sometimes with a thinking flag; the mode goes
// to `harness` and the thinking flag to `setting`. "Total Cost ($)" is the board's estimate for the entire
// benchmark run, so `cost` is a run cost (costPer 'run'). "Latency Mean (s)" and "Latency 95th Percentile (s)"
// are kept as metrics.latency and metrics.latencyP95.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://gorilla.cs.berkeley.edu/data_overall.csv';

const board: Leaderboard = {
  benchmark: 'bfcl-v4',
  url: 'https://gorilla.cs.berkeley.edu/leaderboard.html',
  feed: FEED,
  terms: 'Static CSV on the Gorilla project site; the gorilla repository (ShishirPatil/gorilla) is Apache-2.0.',
  costPer: 'run',
  aliases: {
    'Grok-4-0709': 'grok-4',
    // the board lists the 0905 update separately when it has it; plain Kimi-K2-Instruct is the July 2025 release
    'Moonshotai-Kimi-K2-Instruct': 'kimi-k2-jul-2025',
    'Command A': 'cohere-command-a',
    'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Qwen3-30B-A3B-Instruct-2507': 'qwen3-30b-a3b-instruct-jul-2025',
    'mistral-large-2411': 'mistral-large-2-nov-2024',
    'Mistral-Medium-2505': 'mistral-medium-3',
    'Mistral-small-2506': 'mistral-small-3-2',
    'Mistral-Small-2506': 'mistral-small-3-2',
    'Open-Mistral-Nemo-2407': 'mistral-nemo',
    'Ministral-8B-Instruct-2410': 'ministral-8b',
    'Llama-4-Maverick-17B-128E-Instruct-FP8': 'llama-4-maverick',
    'Llama-4-Scout-17B-16E-Instruct': 'llama-4-scout',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Llama-3.2-1B-Instruct': 'llama-3-2-1b',
    'Llama-3.2-3B-Instruct': 'llama-3-2-3b',
    'Gemma-3-4b-it': 'gemma-3-4b',
    'Gemma-3-12b-it': 'gemma-3-12b',
    'Gemma-3-1b-it': 'gemma-3-1b',
    'Gemma-3-27b-it': 'gemma-3-27b',
    'Amazon-Nova-Pro-v1:0': 'amazon-nova-pro',
    'Amazon-Nova-Micro-v1:0': 'amazon-nova-micro',
  },
  async fetch() {
    return parseCsv(await fetchText(FEED))
      .filter((r) => r.Model && /%$/.test(r['Overall Acc']))
      .map((r) => {
        const mode = r.Model.match(/\s*\(((FC|Prompt)\b[^)]*)\)\s*$/);
        const name = mode ? r.Model.slice(0, mode.index).trim() : r.Model.trim();
        const thinking = mode && /thinking/i.test(mode[1]) ? 'thinking' : undefined;
        // "Grok-4-1-fast-non-reasoning" / "-reasoning": xAI's two modes of one model
        const xai = name.match(/^(.*?)-(non-reasoning|reasoning)$/);
        const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : undefined);
        const latency = num(r['Latency Mean (s)']);
        const latencyP95 = num(r['Latency 95th Percentile (s)']);
        return {
          model: xai ? xai[1] : name,
          score: parseFloat(r['Overall Acc']),
          setting: xai ? xai[2] : thinking,
          harness: mode ? (mode[2] === 'FC' ? 'native function calling' : 'prompted') : undefined,
          cost: num(r['Total Cost ($)']),
          metrics: latency === undefined && latencyP95 === undefined ? undefined : { ...(latency === undefined ? {} : { latency }), ...(latencyP95 === undefined ? {} : { latencyP95 }) },
        };
      });
  },
};
export default board;
