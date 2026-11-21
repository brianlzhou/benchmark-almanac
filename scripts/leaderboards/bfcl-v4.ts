// Berkeley Function Calling Leaderboard. gorilla.cs.berkeley.edu/leaderboard.html loads data_overall.csv
// (BFCL V4, the only version the page shows; "Last Updated" 2026-04-12 at the time of writing). The
// headline is "Overall Acc", a percentage string. Each model name ends in its calling mode: "(FC)" for
// native function calling or "(Prompt)" for prompted calls, sometimes with a thinking flag; the mode goes
// to `setting` together with the thinking flag. "Total Cost ($)" is the board's estimate for the entire
// benchmark run, so `cost` is a run cost (costPer 'run'). "Latency Mean (s)" and "Latency 95th Percentile (s)"
// are kept as metrics.latency and metrics.latencyP95. Read the task-family accuracies and format sensitivity.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://gorilla.cs.berkeley.edu/data_overall.csv';

const taskGroups: Record<string, string[]> = {
  'Non-Live': ['Non-Live AST Acc', 'Non-Live Simple AST', 'Non-Live Multiple AST', 'Non-Live Parallel AST', 'Non-Live Parallel Multiple AST'],
  Live: ['Live Acc', 'Live Simple AST', 'Live Multiple AST', 'Live Parallel AST', 'Live Parallel Multiple AST'],
  'Multi Turn': ['Multi Turn Acc', 'Multi Turn Base', 'Multi Turn Miss Func', 'Multi Turn Miss Param', 'Multi Turn Long Context'],
  'Web Search': ['Web Search Acc', 'Web Search Base', 'Web Search No Snippet'],
  Memory: ['Memory Acc', 'Memory KV', 'Memory Vector', 'Memory Recursive Summarization'],
  Detection: ['Relevance Detection', 'Irrelevance Detection'],
};
const parts = Object.fromEntries(Object.entries(taskGroups).flatMap(([group, columns]) =>
  columns.map(name => [name, { name, group }])));

const board: Leaderboard = {
  benchmark: 'bfcl-v4',
  parts,
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
        const metrics: Record<string, number> = {};
        const columns = {
          'Latency Mean (s)': 'latency', 'Latency Standard Deviation (s)': 'latencyStd',
          'Latency 95th Percentile (s)': 'latencyP95', 'Format Sensitivity Max Delta': 'formatSensitivityMaxDelta',
          'Format Sensitivity Standard Deviation': 'formatSensitivityStd',
        };
        for (const [column, key] of [...Object.entries(columns), ...Object.keys(parts).map(key => [key, key])]) {
          const value = num(r[column]?.replace(/%$/, ''));
          if (value !== undefined) metrics[key] = value;
        }
        return {
          model: xai ? xai[1] : name,
          score: parseFloat(r['Overall Acc']),
          setting: [xai ? xai[2] : thinking, mode ? (mode[2] === 'FC' ? 'native function calling' : 'prompted') : undefined].filter(Boolean).join('; ') || undefined,
          license: r.License || undefined,
          cost: num(r['Total Cost ($)']),

          metrics,
        };
      });
  },
};
export default board;
