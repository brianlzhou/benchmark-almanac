// unsafe-eval Leaderboard (Principled Intelligence): standardized safety classifier and moderation
// API benchmark across 8 prompt-safety datasets (Aegis 2.0, OpenAI Mod, ToxicChat, WildGuardMix,
// CoSApien, DynaGuardrail, SST, and HarmBench). Reads the live Space JSON API at /api/leaderboard.
// Default overview ranks by Avg balanced acc (displayed as 0 to 100%).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://huggingface.co/spaces/principled-intelligence/unsafe-eval-leaderboard';
const FEED = 'https://principled-intelligence-unsafe-eval-leaderboard.hf.space/api/leaderboard';

interface UnsafeEvalFeed {
  rows: Record<string, unknown>[];
}

const pct = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? +(v * 100).toFixed(2) : undefined;

const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

const board: Leaderboard = {
  benchmark: 'unsafe-eval-leaderboard',
  url: SITE,
  feed: FEED,
  terms: 'Public open-source safety benchmark Space published by Principled Intelligence.',
  parts: {
    aegis2Ba: { name: 'Aegis 2.0 (Balanced Acc)', unit: '%', better: 'higher' },
    openaiModBa: { name: 'OpenAI Mod (Balanced Acc)', unit: '%', better: 'higher' },
    toxicChatBa: { name: 'ToxicChat (Balanced Acc)', unit: '%', better: 'higher' },
    wildGuardMixBa: { name: 'WildGuardMix (Balanced Acc)', unit: '%', better: 'higher' },
    coSapienBa: { name: 'CoSApien (Balanced Acc)', unit: '%', better: 'higher' },
    dynaGuardrailBa: { name: 'DynaGuardrail (Balanced Acc)', unit: '%', better: 'higher' },
    sstUnsafeRecall: { name: 'SST (Unsafe Recall)', unit: '%', better: 'higher' },
    harmBenchUnsafeRecall: { name: 'HarmBench (Unsafe Recall)', unit: '%', better: 'higher' },
  },
  stats: {
    avgF1: { name: 'Average F1', unit: '%', better: 'higher', note: 'Average unsafe-class F1 across the six mixed benchmarks.' },
    avgUnsafeRecall: { name: 'Average unsafe recall', unit: '%', better: 'higher', note: 'Average recall on unsafe prompts across SST and HarmBench.' },
    aegis2F1: { name: 'Aegis 2.0 F1', unit: '%', better: 'higher' },
    openaiModF1: { name: 'OpenAI Mod F1', unit: '%', better: 'higher' },
    toxicChatF1: { name: 'ToxicChat F1', unit: '%', better: 'higher' },
    wildGuardMixF1: { name: 'WildGuardMix F1', unit: '%', better: 'higher' },
    coSapienF1: { name: 'CoSApien F1', unit: '%', better: 'higher' },
    dynaGuardrailF1: { name: 'DynaGuardrail F1', unit: '%', better: 'higher' },
    refusalRate: { name: 'Refusal rate', unit: '%', better: 'lower', note: 'Share of evaluation prompts the model refused to classify.' },
    latencySeconds: { name: 'Average latency', unit: 'seconds', better: 'lower', note: 'Average classification latency per prompt in seconds.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const data = JSON.parse(await fetchText(FEED)) as UnsafeEvalFeed;
    const partMap: readonly [string, string][] = [
      ['Aegis 2.0 BA', 'aegis2Ba'],
      ['OpenAI Mod BA', 'openaiModBa'],
      ['ToxicChat BA', 'toxicChatBa'],
      ['WildGuardMix BA', 'wildGuardMixBa'],
      ['CoSApien BA', 'coSapienBa'],
      ['DynaGuardrail BA', 'dynaGuardrailBa'],
      ['SST unsafe recall', 'sstUnsafeRecall'],
      ['HarmBench unsafe recall', 'harmBenchUnsafeRecall'],
    ];
    const statPctMap: readonly [string, string][] = [
      ['Avg F1', 'avgF1'],
      ['Avg unsafe recall', 'avgUnsafeRecall'],
      ['Aegis 2.0 F1', 'aegis2F1'],
      ['OpenAI Mod F1', 'openaiModF1'],
      ['ToxicChat F1', 'toxicChatF1'],
      ['WildGuardMix F1', 'wildGuardMixF1'],
      ['CoSApien F1', 'coSapienF1'],
      ['DynaGuardrail F1', 'dynaGuardrailF1'],
      ['Refusal rate', 'refusalRate'],
    ];

    const rows: LeaderboardRow[] = [];
    for (const r of data.rows ?? []) {
      const rawModel = typeof r['Model'] === 'string' ? r['Model'].trim() : '';
      const score = pct(r['Avg balanced acc']);
      if (!rawModel || score === undefined) continue;
      let model = rawModel;
      let setting: string | undefined;
      const tick = rawModel.match(/^(.+?)\s+`([^`]+)`$/);
      if (tick) {
        model = tick[1].trim();
        setting = tick[2].trim();
      }

      const metrics: Record<string, number> = {};
      for (const [src, dst] of partMap) {
        const v = pct(r[src]);
        if (v !== undefined) metrics[dst] = v;
      }
      for (const [src, dst] of statPctMap) {
        const v = pct(r[src]);
        if (v !== undefined) metrics[dst] = v;
      }
      const lat = num(r['Latency']);
      if (lat !== undefined && lat > 0) metrics.latencySeconds = +lat.toFixed(4);

      const cost = num(r['Cost']);
      const tokens = num(r['Output tokens']);
      const params = num(r['Params (B)']);
      const open = typeof r['Open weights'] === 'boolean' ? r['Open weights'] : undefined;
      const linkRaw = typeof r['Link'] === 'string' ? r['Link'].trim().replace(/&amp;/g, '&') : undefined;

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(open !== undefined ? { open } : {}),
        ...(params !== undefined && params > 0 ? { params } : {}),
        ...(cost !== undefined && cost > 0 ? { cost: +cost.toFixed(5) } : {}),
        ...(tokens !== undefined && tokens > 0 ? { tokens: Math.round(tokens) } : {}),
        ...(linkRaw && /^https?:\/\/\S+$/.test(linkRaw) ? { link: linkRaw } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
