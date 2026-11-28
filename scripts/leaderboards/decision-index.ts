// Decision Index (text board, version 0.4.1). The makers' static Hugging Face space
// (multimodalart/jev-decision-index) renders data/index.json; its default sort is the Decision Index (Full),
// stored per model as scores.balanced_skill: 0.6 x same-skill sets + 0.4 x new-domain sets, both equated
// on 21 base models (the board's "Full" column, and the score here). Most entries are fine-tunes, LoRAs or
// inference techniques built on open base models (meta.kind), so few are models in the registry.
// Technique rows named "Technique · Base model" credit the base model, with the technique as the harness.
// The separate vision board is not read.
// Each entry's latency.median (milliseconds per request on one RTX PRO 6000; an HTTP round trip for hosted APIs)
// is kept as metrics.latency in seconds, for the board's "Median latency vs Decision Index" chart, and its
// calibration.ece (expected calibration error) as metrics.ece in points, as the calibration chart shows it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/index.json';

interface Entry {
  name: string;
  meta?: { kind?: string; served_params?: number; params_estimated?: boolean; params_from_name?: boolean; trained_bytes?: number };
  completed?: number;
  coverage?: number;
  pending?: number;
  latency_rows?: number;
  results?: Record<string, unknown>;
  benchmarks?: Record<string, unknown>;
  categories?: { id: string }[];
  counts?: Record<string, number>;
  gaps?: Record<string, unknown>;
  frozen_scores?: Record<string, number>;
  v03?: { parts?: Record<string, number>; eq?: Record<string, number> };
  scores?: { balanced_skill?: number };
  latency?: { median?: number | null };
  calibration?: { ece?: number | null } | null;
}

const board: Leaderboard = {
  benchmark: 'decision-index',
  parts: {
    'index:parts:same_skills': { name: 'Same skills', note: 'Weighted contribution from private same-skill tests.' },
    'index:parts:new_domains': { name: 'New domains', note: 'Weighted contribution from private new-domain tests.' },
  },
  stats: {
    ece: { name: 'Expected calibration error', unit: 'score', better: 'lower', note: 'Calibration error, stored in percentage points.' },
    latency: { name: 'Median latency', unit: 'seconds', better: 'lower' },
    completed: { name: 'Completed benchmarks', unit: 'count' },
    coverage: { name: 'Benchmark coverage', unit: 'score', better: 'higher' },
    pending: { name: 'Pending benchmark share', unit: 'score', better: 'lower' },
    latency_rows: { name: 'Latency rows', unit: 'count' },
    trainedBytes: { name: 'Trained weights size', unit: 'count', note: 'Reported trained weight bytes.' },
    'latencySeconds:mean': { name: 'Mean latency', unit: 'seconds', better: 'lower' },
    'latencySeconds:median': { name: 'Median latency (raw)', unit: 'seconds', better: 'lower' },
    'latencySeconds:p95': { name: '95th-percentile latency', unit: 'seconds', better: 'lower' },
    'counts:ok': { name: 'Successful responses', unit: 'count' },
    'counts:error': { name: 'Error responses', unit: 'count', better: 'lower' },
    'counts:unsupported': { name: 'Unsupported responses', unit: 'count', better: 'lower' },
    'counts:abstained': { name: 'Abstained responses', unit: 'count' },
    'gaps:share': { name: 'Gap share', unit: 'score', better: 'lower' },
    'scores:balanced_raw': { name: 'Balanced raw score', unit: 'score', better: 'higher' },
    'scores:balanced_skill': { name: 'Balanced skill score', unit: 'score', better: 'higher' },
    'scores:breadth_skill': { name: 'Breadth skill score', unit: 'score', better: 'higher' },
    'scores:public_skill': { name: 'Public skill score', unit: 'score', better: 'higher' },
    'frozen_scores:balanced_raw': { name: 'Frozen balanced raw score', unit: 'score', better: 'higher' },
    'frozen_scores:balanced_skill': { name: 'Frozen balanced skill score', unit: 'score', better: 'higher' },
    'frozen_scores:breadth_skill': { name: 'Frozen breadth skill score', unit: 'score', better: 'higher' },
    'calibration:acc': { name: 'Calibration accuracy', unit: 'score', better: 'higher' },
    'calibration:conf': { name: 'Calibration mean confidence', unit: 'score' },
    'calibration:ece': { name: 'Expected calibration error (fraction)', unit: 'score', better: 'lower' },
    'calibration:brier': { name: 'Calibration Brier score', unit: 'brier', better: 'lower' },
    'calibration:over95': { name: 'Over-95% confidence share', unit: 'score' },
    'calibration:n': { name: 'Calibration item count', unit: 'count' },
    'calibration:benchmarks': { name: 'Calibrated benchmarks', unit: 'count' },
    'index:v': { name: 'Index full score', unit: 'score', better: 'higher' },
    'index:pub': { name: 'Index public score', unit: 'score', better: 'higher' },
    'index:same_skills': { name: 'Index same-skills score', unit: 'score', better: 'higher' },
    'index:new_domains': { name: 'Index new-domains score', unit: 'score', better: 'higher' },
    'index:eq:S': { name: 'Equated same-skills score', unit: 'score', better: 'higher' },
    'index:eq:O': { name: 'Equated out-of-domain score', unit: 'score', better: 'higher' },
    ...Object.fromEntries(['arts', 'knowledge', 'language', 'retrieval', 'tools'].flatMap(a => {
      const label = a[0].toUpperCase() + a.slice(1);
      return [
        [`area:${a}:combined`, { name: `${label} combined score`, unit: 'score', better: 'higher' }],
        [`area:${a}:coverage`, { name: `${label} coverage`, unit: 'score', better: 'higher' }],
        [`area:${a}:raw`, { name: `${label} raw score`, unit: 'score', better: 'higher' }],
        [`area:${a}:skill`, { name: `${label} skill score`, unit: 'score', better: 'higher' }],
        [`calibration:areas:${a}:acc`, { name: `${label} calibration accuracy`, unit: 'score', better: 'higher' }],
        [`calibration:areas:${a}:conf`, { name: `${label} calibration confidence`, unit: 'score' }],
        [`calibration:areas:${a}:ece`, { name: `${label} calibration ECE`, unit: 'score', better: 'lower' }],
      ];
    })),
    ...Object.fromEntries(['ACOS','ANLI','API-Bank','ARC-Challenge','ARC-Easy','Amazon ESCI','BANKING77','BBH','BFCL','BPoMP','BRIGHT','Boxoban','CLINC150','CLadder','CRUXEval','ChessBench','Codenames','ContractNLI','FinEntity','GPQA Diamond','GSM8K','HLE','Habermas','Hanabi','HellaSwag','HoVer','Home appliances','Humicroedit','MMLU-Pro','MMLU','MiniWoB++','MuSR','NLI4CT','New Yorker','POP909','PhishNChips','RAGTruth','RTFM','RouterBench','SATA-Bench','SGD','ScienceWorld','ToolRet','VAST','When2Call','WinoGrande','cfcolor','iSarcasmEval'].flatMap(b => [
      [`benchmarks:${b}:coverage`, { name: `${b} coverage`, unit: 'score', better: 'higher' }],
      [`benchmarks:${b}:raw`, { name: `${b} raw score`, unit: 'score', better: 'higher' }],
      [`benchmarks:${b}:skill`, { name: `${b} skill score`, unit: 'score', better: 'higher' }],
    ])),
    ...Object.fromEntries(['ACOS','ANLI','API-Bank','Amazon ESCI','BANKING77','BBH','BFCL','BPoMP','BRIGHT','CLINC150','CLadder','CRUXEval','ChessBench','FinEntity','GPQA Diamond','GSM8K','Habermas','HellaSwag','HoVer','Home appliances','Humicroedit','MMLU-Pro','MuSR','NLI4CT','New Yorker','POP909','PhishNChips','RAGTruth','SATA-Bench','ToolRet','VAST','When2Call','WinoGrande','iSarcasmEval'].flatMap(b => [
      [`benchmarks:${b}:combined`, { name: `${b} combined score`, unit: 'score', better: 'higher' }],
      [`benchmarks:${b}:private_eq`, { name: `${b} equated private score`, unit: 'score', better: 'higher' }],
    ])),
    ...Object.fromEntries(['ACOS','ANLI','API-Bank','ARC-Challenge','ARC-Easy','Amazon ESCI','BANKING77','BBH','BFCL','BPoMP','BRIGHT','CLINC150','CLadder','CRUXEval','ChessBench','ContractNLI','FinEntity','GPQA Diamond','GSM8K','HLE','Habermas','HellaSwag','HoVer','Home appliances','Humicroedit','MMLU-Pro','MMLU','MuSR','NLI4CT','New Yorker','POP909','PhishNChips','RAGTruth','RouterBench','SATA-Bench','SGD','ToolRet','VAST','When2Call','WinoGrande','cfcolor','iSarcasmEval'].flatMap(b => [
      ...(b === 'GSM8K' ? [] : [[`results:${b}:median_ms`, { name: `${b} median latency`, unit: 'ms', better: 'lower' }]]),
      [`results:${b}:score`, { name: `${b} score`, unit: 'score', better: 'higher' }],
    ])),
  },
  url: 'https://huggingface.co/spaces/multimodalart/jev-decision-index',
  feed: `${FEED} (scores.balanced_skill)`,
  terms: 'JSON in the makers’ static Hugging Face space; the board’s dataset mirror (multimodalart/decision-index-leaderboard) is CC BY 4.0 and the evaluation kit MIT.',
  aliases: {},
  chart: {
    title: 'Median latency vs Decision Index',
    note: 'Median time per request on one RTX PRO 6000, on a log scale. For hosted APIs it is an HTTP round trip, so not a controlled comparison.',
    x: { key: 'latency', label: 'Median latency', unit: 's', better: 'lower', log: true },
    y: { key: 'score', label: 'Decision Index (Full)', better: 'higher' },
  },
  async fetch() {
    const { models, benchmarks } = await fetchJson<{ models: Entry[]; benchmarks: Record<string, { short: string }> }>(FEED);
    const skipMetric = /^(?:index:rank_|index:parts:public$|area:[^:]+:(?:n|pending)$|benchmarks:[^:]+:random$|results:[^:]+:(?:answered|errors|jev|requests|unsupported|wrong_rows)$)/;
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const score = m.scores?.balanced_skill;
      if (!m.name || typeof score !== 'number') continue;
      const metrics: Record<string, number> = {};
      if (typeof m.latency?.median === 'number' && m.latency.median > 0) metrics.latency = m.latency.median / 1000;
      if (typeof m.calibration?.ece === 'number') metrics.ece = m.calibration.ece * 100;
      function numbers(prefix: string, value: unknown) {
        if (typeof value === 'number' && Number.isFinite(value)) { if (!skipMetric.test(prefix)) metrics[prefix] = value; }
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const [key, nested] of Object.entries(value)) numbers(prefix + ':' + key, nested);
        }
      }
      for (const key of ['completed', 'coverage', 'pending', 'latency_rows', 'counts', 'gaps', 'scores', 'frozen_scores', 'calibration'] as const) numbers(key, m[key]);
      numbers('index', m.v03);
      for (const [key, value] of Object.entries(m.latency ?? {})) {
        if (typeof value === 'number') metrics['latencySeconds:' + key] = value / 1000;
      }
      for (const category of m.categories ?? []) numbers('area:' + category.id, category);
      for (const source of ['benchmarks', 'results'] as const) {
        for (const [id, value] of Object.entries(m[source] ?? {})) numbers(source + ':' + (benchmarks[id]?.short ?? id), value);
      }
      numbers('trainedBytes', m.meta?.trained_bytes);
      const count = m.meta?.served_params;
      const extra = { metrics, params: typeof count === 'number' && count > 0 ? count / 1e9 : undefined };
      // "Decider chat · Gemma-4-31B": an inference technique run on a stock model, kept like a harness
      const parts = m.meta?.kind === 'inference technique' ? m.name.split(' · ') : [];
      if (parts.length === 2) rows.push({ model: parts[1].replace(/\s*\([^)]*\)$/, '').trim(), harness: parts[0].trim(), score, ...extra });
      else rows.push({ model: m.name.trim(), score, ...extra });
    }
    if (!rows.length) throw new Error('no scored models in the Decision Index');
    return rows;
  },
};
export default board;
