// RSIBench-Infra (ByteDance Seed and Tsinghua AIR SIA-Lab): 20 production-scale training and inference infrastructure
// optimization tasks (16 inference serving workloads and 4 training pipelines). The Next.js project page embeds the
// precomputed leaderboard JSON in its page bundle (section 02 RSIBench-Infra, I.Ge) with Faster rate (% of formally
// scored tasks exceeding 1.10x speedup), median speedup, mean SOL score and per-task SOL scores. Untested tasks
// (status !== 'completed') are omitted from per-task parts rather than recorded as 0.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const RSI_URL = 'https://rsibench-infra.github.io/';

export interface RsiFullTask {
  task: string;
  reward: number | null;
  status: string;
  sol_score: number;
}

export interface RsiFullModel {
  model: string;
  display_name: string;
  agents?: string[];
  faster_rate_percent: number;
  median_speedup: number;
  mean_sol_score: number;
  aggregation_task_count: number;
  partial_evaluation: boolean;
  tasks: RsiFullTask[];
}

export interface RsiLiteModel {
  model: string;
  display_name: string;
  mean_score: number;
  aggregation_task_count: number;
  partial_evaluation: boolean;
  tasks: { task: string; score: number; speedup: number | null; status: string }[];
}

export interface RsiBundleData {
  full: RsiFullModel[];
  lite: RsiLiteModel[];
}

export const RSI_NAMES: Record<string, string> = {
  'claude-opus-5-5': 'Claude Opus 5.5',
  'gpt-6-astra': 'GPT-6 Astra',
  'glm-5.3': 'GLM-5.3',
  'qwen3.8-max': 'Qwen3.8 Max',
  'deepseek-v4-flash': 'DeepSeek V4 Flash',
  'kimi-k3': 'Kimi K3',
  'seed-evolving-auto': 'Seed Evolving Auto',
};

export const RSI_HARNESSES: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  opencode: 'OpenCode',
};

function parseSingleQuotedJson<T>(js: string, marker: RegExp, label: string): T {
  const m = js.match(marker);
  if (!m) throw new Error(`RSIBench-Infra bundle missing ${label}`);
  const start = m.index! + m[0].length;
  let i = start;
  let out = '';
  while (i < js.length && js[i] !== "'") {
    if (js[i] === '\\' && i + 1 < js.length) {
      const next = js[i + 1];
      if (next === "'") out += "'";
      else out += js[i] + next;
      i += 2;
    } else {
      out += js[i++];
    }
  }
  if (js[i] !== "'") throw new Error(`RSIBench-Infra bundle unterminated ${label}`);
  return JSON.parse(out) as T;
}

export async function fetchRsiBundle(): Promise<RsiBundleData> {
  const html = await fetchText(RSI_URL);
  const chunk = html.match(/\/_next\/static\/chunks\/app\/page-[^"']+\.js/)?.[0];
  if (!chunk) throw new Error('RSIBench-Infra page chunk path missing');
  const js = await fetchText(`https://rsibench-infra.github.io${chunk}`);
  const fullObj = parseSingleQuotedJson<{ Ge: RsiFullModel[] }>(js, /JSON\.parse\('(?=\{"Ge":\[\{"model":)/, 'full results');
  const liteObj = parseSingleQuotedJson<{ Jn: RsiLiteModel[] }>(js, /JSON\.parse\('(?=\{"Ge":\[\{"task":)/, 'lite results');
  return { full: fullObj.Ge, lite: liteObj.Jn };
}

const FULL_TASKS: Record<string, { key: string; name: string; group: string }> = {
  'infer-deepseekv4flash-284b': { key: 'inferDeepseekV4Flash', name: 'DeepSeek V4 Flash', group: 'Inference' },
  'infer-glm5p2-744b': { key: 'inferGlm52', name: 'GLM-5.2', group: 'Inference' },
  'infer-glm5p3-744b': { key: 'inferGlm53', name: 'GLM-5.3', group: 'Inference' },
  'infer-glm5p3flash-320b': { key: 'inferGlm53Flash', name: 'GLM-5.3 Flash', group: 'Inference' },
  'infer-inkling-975b': { key: 'inferInkling', name: 'Inkling', group: 'Inference' },
  'infer-kimik3-2p8t': { key: 'inferKimiK3', name: 'Kimi K3', group: 'Inference' },
  'infer-lingbotworld2p0-14b': { key: 'inferLingbotWorld2', name: 'LingBot World 2.0', group: 'Inference' },
  'infer-llada2p1mini-16b': { key: 'inferLlada21Mini', name: 'LLaDA 2.1 Mini', group: 'Inference' },
  'infer-minimaxh3-64b': { key: 'inferMinimaxH3', name: 'MiniMax H3', group: 'Inference' },
  'infer-museglimmer-30b': { key: 'inferMuseGlimmer', name: 'Muse Glimmer', group: 'Inference' },
  'infer-nemotron3ultra-550a55b': { key: 'inferNemotron3Ultra', name: 'Nemotron 3 Ultra', group: 'Inference' },
  'infer-pi0p5libero-3p3b': { key: 'inferPi05Libero', name: 'Pi0.5 LIBERO', group: 'Inference' },
  'infer-qwen3p8-27b': { key: 'inferQwen38', name: 'Qwen3.8-27B', group: 'Inference' },
  'infer-qwen3ttsbase-1p7b': { key: 'inferQwen3Tts', name: 'Qwen3 TTS', group: 'Inference' },
  'infer-qwen3vl-32b': { key: 'inferQwen3Vl', name: 'Qwen3-VL-32B', group: 'Inference' },
  'infer-wan2p2ti2v-5b': { key: 'inferWan22', name: 'Wan 2.2 TI2V', group: 'Inference' },
  'train-qwen3-30a3b-grpo': { key: 'trainQwen3Grpo', name: 'Qwen3 GRPO', group: 'Training' },
  'train-qwen3-30a3b-sft': { key: 'trainQwen3Sft', name: 'Qwen3 SFT', group: 'Training' },
  'train-qwen3-8b-opd': { key: 'trainQwen3Opd', name: 'Qwen3 OPD', group: 'Training' },
  'train-qwen3vl-4b-grpo': { key: 'trainQwen3VlGrpo', name: 'Qwen3-VL GRPO', group: 'Training' },
};

const round = (x: number, d = 3) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

const board: Leaderboard = {
  benchmark: 'rsibench-infra',
  url: RSI_URL,
  feed: RSI_URL,
  terms: 'The authors publish the RSIBench-Infra leaderboard on GitHub Pages with no robots.txt restrictions.',
  harnesses: 'system',
  parts: Object.fromEntries(
    Object.values(FULL_TASKS).map(({ key, name, group }) => [key, { name, group, unit: 'score', better: 'higher' as const }]),
  ),
  stats: {
    medianSpeedup: {
      name: 'Median speedup',
      unit: 'speedup',
      better: 'higher',
      note: 'Median speedup across formally scored workloads.',
    },
    meanSolScore: {
      name: 'Mean SOL score',
      unit: 'score',
      better: 'higher',
      note: 'Mean normalized speed-of-light score capped at 1.0 per task across formally scored workloads.',
    },
  },
  async fetch() {
    const { full } = await fetchRsiBundle();
    if (!Array.isArray(full) || full.length < 5) {
      throw new Error(`RSIBench-Infra full leaderboard changed: only ${full?.length ?? 0} rows`);
    }
    return full.map((m): LeaderboardRow => {
      if (!Number.isFinite(m.faster_rate_percent) || !Number.isFinite(m.median_speedup) || !Number.isFinite(m.mean_sol_score)) {
        throw new Error(`RSIBench-Infra row malformed: ${m.display_name}`);
      }
      const metrics: Record<string, number> = {
        medianSpeedup: round(m.median_speedup, 2),
        meanSolScore: round(m.mean_sol_score, 3),
      };
      for (const t of m.tasks) {
        if (t.status !== 'completed') continue;
        const spec = FULL_TASKS[t.task];
        if (spec && Number.isFinite(t.sol_score)) metrics[spec.key] = round(t.sol_score, 3);
      }
      const rawAgent = m.agents?.[0];
      const harness = rawAgent ? (RSI_HARNESSES[rawAgent] ?? rawAgent) : undefined;
      return {
        model: RSI_NAMES[m.display_name] ?? m.display_name,
        score: round(m.faster_rate_percent, 2),
        ...(harness ? { harness } : {}),
        ...(m.partial_evaluation ? { setting: `Partial coverage (${m.aggregation_task_count}/20 tasks)` } : {}),
        metrics,
      };
    });
  },
};

export default board;
