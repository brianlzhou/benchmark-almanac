// AudioJevBench scores audio decision systems. The full-coverage ranking uses composite B.
// The release JSON includes the latency, price, and robustness results behind the table.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://benchmarkheaven.com/audio-jev-bench";
const feed = "https://raw.githubusercontent.com/fstandhartinger/model-market-comparison/main/data/audiojev-preview.json";
const names: Record<string, string> = {
  'audiojev': 'AudioJev (mocomoco edge ONNX)', 'qwen2.5-omni-3b': 'Qwen2.5-Omni-3B',
  'qwen2.5-omni-7b': 'Qwen2.5-Omni-7B', 'qwen2-audio-7b-instruct': 'Qwen2-Audio-7B-Instruct',
  'ultravox-v0_5-llama-3_2-1b': 'Ultravox v0.5 (Llama 3.2 1B)', 'moss-audio-4b-instruct': 'MOSS-Audio-4B-Instruct',
  'voxtral-mini-3b-2507': 'Voxtral Mini 3B (2507)', 'qwen3-omni-30b-a3b-instruct': 'Qwen3-Omni-30B-A3B-Instruct',
  'cascade whisper-large-v3-turbo -> qwen3-4b-instruct-2507': 'Whisper large-v3-turbo → Qwen3-4B-Instruct-2507',
};
const slices = { clean: 'Clean audio', noisy_le5db: 'Noisy (≤ 5 dB SNR)', snr_15db: '15 dB', snr_10db: '10 dB',
  snr_5db: '5 dB', snr_0db: '0 dB', english: 'English', non_english: 'Non-English', background_talker: 'Background talker',
  overlap: 'Overlapping talkers', speaker_verification: 'Speaker verification', sound_event: 'Sound events' };
const numeric = ['Capability', 'Intelligence', 'I_public', 'I_sealed', 'Calibration', 'Speed', 'Cost', 'gap', 'penalty',
  'p50_s', 'p95_s', 'p50_adj_s', 'p95_adj_s', 'n_latency', 'n_items_scored'] as const;
type System = Record<typeof numeric[number], number> & { key: string, table: string, composite: {B: number},
  cost: {usd_per_1000: number}, robustness: Record<string, {acc: number | null}> };
const board: Leaderboard = {
  benchmark: 'audiojevbench', url, feed,
  stats: { Capability:{name:'Capability score',unit:'%',better:'higher'}, Intelligence:{name:'Intelligence score',unit:'%',better:'higher'}, I_public:{name:'Public intelligence',unit:'score',better:'higher'}, I_sealed:{name:'Sealed intelligence',unit:'score',better:'higher'}, Calibration:{name:'Calibration score',unit:'%',better:'higher'}, Speed:{name:'Speed score',unit:'%',better:'higher'}, Cost:{name:'Cost score',unit:'%',better:'higher'}, gap:{name:'Robustness gap',unit:'score',better:'lower'}, p50_s:{name:'Median latency',unit:'seconds',better:'lower'}, p95_s:{name:'95th percentile latency',unit:'seconds',better:'lower'}, p50_adj_s:{name:'Adjusted median latency',unit:'seconds',better:'lower'}, p95_adj_s:{name:'Adjusted 95th percentile latency',unit:'seconds',better:'lower'}, n_latency:{name:'Latency samples',unit:'count'}, n_items_scored:{name:'Items scored',unit:'count'} },
  terms: "Benchmark Heaven allows this path in robots.txt. Its code uses MIT and the page gives no separate audio score license. The raw file host publishes no robots.txt.",
  parts: Object.fromEntries(Object.entries(slices).map(([k, name]) => [k, { name, unit: '%' }])),
  async fetch() {
    const data = await fetchJson<{systems: System[]}>(feed);
    const ranked = data.systems.filter(r => r.table === 'full');
    if (ranked.length < 9) throw new Error('Incomplete AudioJevBench full ranking');
    return ranked.map(r => {
      const model = names[r.key.split(' (')[0]] ?? r.key.split(' (')[0];
      if (!model || !Number.isFinite(r.composite.B)) throw new Error('Invalid AudioJevBench system');
      const metrics: Record<string, number> = {};
      for (const key of numeric) {
        if (typeof r[key] === 'number') metrics[key] = r[key];
      }
      for (const k of Object.keys(slices)) {
        const v = r.robustness[k]?.acc;
        if (typeof v === 'number') metrics[k] = v * 100;
      }
      return { model, score: r.composite.B, metrics, cost: r.cost.usd_per_1000 / 1000,
        setting: r.key.startsWith('audiojev (') ? 'local CPU' : 'self-hosted GPU',
        ...(r.key.startsWith('cascade ') ? { models: ['Whisper large-v3-turbo', 'Qwen3-4B-Instruct-2507'] } : {}) };
    });
  },
};
export default board;
