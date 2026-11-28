// The ML.ENERGY Leaderboard v3 (ML.ENERGY Initiative, University of Michigan): real GPU energy
// consumption and latency across standardized LLM workloads. Reads the live task JSONs served at
// https://ml.energy/leaderboard/data/tasks/<task>.json for the default Problem Solving with Reasoning
// view (gpqa, median ITL deadline 300 ms), selecting the lowest energy-per-token (J/token)
// configuration per model and GPU, and attaches matching-GPU energy per token on Text Conversation.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const BASE = 'https://ml.energy/leaderboard/data/tasks';
const GPQA_FEED = `${BASE}/gpqa.json`;
const CHAT_FEED = `${BASE}/lm-arena-chat.json`;
const DEFAULT_ITL_DEADLINE_MS = 300;

interface EnergyConfig {
  model_id: string;
  nickname?: string;
  gpu_model: string;
  num_gpus: number;
  max_num_seqs?: number;
  weight_precision?: string;
  total_params_billions?: number;
  activated_params_billions?: number;
  energy_per_request_joules: number;
  energy_per_token_joules?: number;
  median_itl_ms?: number;
  p95_itl_ms?: number;
  avg_output_len?: number;
  avg_power_watts?: number;
  output_throughput_tokens_per_sec?: number;
}

interface EnergyTaskFeed {
  configurations: EnergyConfig[];
}

function bestByModelGpu(configs: EnergyConfig[]): Map<string, EnergyConfig> {
  const grouped = new Map<string, EnergyConfig[]>();
  for (const c of configs) {
    if (!c.model_id || !c.gpu_model || typeof c.energy_per_token_joules !== 'number' || !Number.isFinite(c.energy_per_token_joules)) continue;
    const k = `${c.model_id}|${c.gpu_model}`;
    const list = grouped.get(k);
    if (list) list.push(c);
    else grouped.set(k, [c]);
  }
  const best = new Map<string, EnergyConfig>();
  for (const [k, list] of grouped) {
    const within = list.filter((c) => typeof c.median_itl_ms === 'number' && c.median_itl_ms <= DEFAULT_ITL_DEADLINE_MS);
    const pool = within.length ? within : list;
    pool.sort((a, b) => (a.energy_per_token_joules ?? Infinity) - (b.energy_per_token_joules ?? Infinity));
    best.set(k, pool[0]);
  }
  return best;
}

const board: Leaderboard = {
  benchmark: 'ml-energy-leaderboard-v3',
  url: 'https://ml.energy/leaderboard/',
  feed: GPQA_FEED,
  terms: 'Public CC-BY-4.0 benchmark data published by the ML.ENERGY Initiative at the University of Michigan.',
  chart: {
    title: 'Energy per token versus inter-token latency',
    x: { key: 'medianItlMs', label: 'Median ITL', unit: 'ms', better: 'lower' },
    y: { key: 'score', label: 'Energy per token (J)', unit: 'J/tok', better: 'lower' },
    note: 'Matches the latency versus energy Pareto scatter plot on the ML.ENERGY v3 Problem Solving leaderboard under a 300 ms median ITL deadline.',
  },
  parts: {
    chatEnergyPerTokenJ: { name: 'Text Conversation (J/token)', unit: 'score', better: 'lower' },
  },
  stats: {
    energyPerRequestJ: { name: 'Energy per response (J)', unit: 'score', better: 'lower', note: 'Average GPU energy in joules consumed to generate one full response.' },
    medianItlMs: { name: 'Median ITL', unit: 'ms', better: 'lower', note: 'Median inter-token latency in milliseconds.' },
    p95ItlMs: { name: 'p95 ITL', unit: 'ms', better: 'lower', note: '95th-percentile inter-token latency in milliseconds.' },
    throughput: { name: 'Output throughput', unit: 'tokens/s', better: 'higher', note: 'Aggregate output tokens generated per second.' },
    avgPowerW: { name: 'Average GPU power (W)', unit: 'score', better: 'lower', note: 'Average total GPU power draw in watts during the workload.' },
    perfPerWatt: { name: 'Tokens per joule (tok/s/W)', unit: 'score', better: 'higher', note: 'Output tokens per second divided by average GPU power in watts (equivalent to tokens per joule).' },
    activeParams: { name: 'Active parameters', unit: 'billions', note: 'Active parameter count for mixture-of-experts models.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const [gpqaText, chatText] = await Promise.all([
      fetchText(GPQA_FEED),
      fetchText(CHAT_FEED),
    ]);
    const gpqaBest = bestByModelGpu((JSON.parse(gpqaText) as EnergyTaskFeed).configurations ?? []);
    const chatBest = bestByModelGpu((JSON.parse(chatText) as EnergyTaskFeed).configurations ?? []);

    const rows: LeaderboardRow[] = [];
    for (const [key, c] of gpqaBest) {
      const metrics: Record<string, number> = {};
      if (typeof c.energy_per_request_joules === 'number' && Number.isFinite(c.energy_per_request_joules)) {
        metrics.energyPerRequestJ = +c.energy_per_request_joules.toFixed(2);
      }
      if (typeof c.median_itl_ms === 'number' && Number.isFinite(c.median_itl_ms)) {
        metrics.medianItlMs = +c.median_itl_ms.toFixed(1);
      }
      if (typeof c.p95_itl_ms === 'number' && Number.isFinite(c.p95_itl_ms)) {
        metrics.p95ItlMs = +c.p95_itl_ms.toFixed(1);
      }
      if (typeof c.output_throughput_tokens_per_sec === 'number' && Number.isFinite(c.output_throughput_tokens_per_sec)) {
        metrics.throughput = +c.output_throughput_tokens_per_sec.toFixed(1);
      }
      if (typeof c.avg_power_watts === 'number' && Number.isFinite(c.avg_power_watts)) {
        metrics.avgPowerW = +c.avg_power_watts.toFixed(1);
        if (typeof c.output_throughput_tokens_per_sec === 'number' && c.avg_power_watts > 0) {
          metrics.perfPerWatt = +(c.output_throughput_tokens_per_sec / c.avg_power_watts).toFixed(2);
        }
      }
      if (
        typeof c.total_params_billions === 'number' &&
        typeof c.activated_params_billions === 'number' &&
        c.activated_params_billions > 0 &&
        c.activated_params_billions < c.total_params_billions
      ) {
        metrics.activeParams = c.activated_params_billions;
      }
      const ch = chatBest.get(key);
      if (ch && typeof ch.energy_per_token_joules === 'number' && Number.isFinite(ch.energy_per_token_joules)) {
        metrics.chatEnergyPerTokenJ = +ch.energy_per_token_joules.toFixed(4);
      }

      const settingBits = [
        `${c.gpu_model}`,
        `${c.num_gpus}x GPU`,
        c.weight_precision,
        c.max_num_seqs ? `max batch ${c.max_num_seqs}` : undefined,
      ].filter(Boolean);

      const link = c.model_id.includes('/') ? `https://huggingface.co/${c.model_id}` : undefined;

      rows.push({
        model: c.model_id,
        score: +c.energy_per_token_joules!.toFixed(4),
        setting: settingBits.join(', '),
        open: true,
        ...(typeof c.total_params_billions === 'number' && c.total_params_billions > 0 ? { params: c.total_params_billions } : {}),
        ...(typeof c.avg_output_len === 'number' && Number.isFinite(c.avg_output_len) ? { tokens: Math.round(c.avg_output_len) } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
