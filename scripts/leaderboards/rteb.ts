// RTEB beta: the published meanTask (nDCG@10), converted to percent, is the score.
// Require all benchmark tasks. Incomplete submissions never receive an overall row.
// Keep the model metadata, embedding configuration and task scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/RTEB%28beta%29/scores";
const board: Leaderboard = {
  "benchmark": "rteb",
  "url": "https://huggingface.co/spaces/mteb/leaderboard",
  "feed": "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/RTEB%28beta%29/scores",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  stats: {
    activeParamsB: { name: 'Active parameters', unit: 'billions' }, maxTokens: { name: 'Maximum context tokens', unit: 'tokens' },
    embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, zeroShotPct: { name: 'Zero-shot percentage', unit: '%' },
    opennessScore: { name: 'Openness score', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
      const data = await fetchJson<{
        benchmarkName: string; tasks: string[];
        rows: {
          model: {name: string; openWeights?: boolean; license?: string; opennessScore?: number};
          meanTask: number; meanTaskType?: number; meanPrivate?: number; meanPublic?: number;
          activeParamsB?: number; totalParamsB?: number; maxTokens?: number; embeddingDim?: number; zeroShotPct?: number;
          scoresByTaskType: Record<string, number>; scoresByTask?: Record<string, number>;
          scoresByCustomGroup?: Record<string, Record<string, number>>;
        }[];
      }>(FEED);
      if (data.benchmarkName !== 'RTEB(beta)' || !data.tasks.length) throw new Error('Unexpected RTEB response');
      const parts = board.parts ?? {};
      const keyOf = (label: string) => label.replace(/^[A-Z]/, c => c.toLowerCase())
        .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
      const result = data.rows.filter(r => Number.isFinite(r.meanTask) && data.tasks.every(task => Number.isFinite(r.scoresByTask?.[task]))).map(r => {
        const metrics: Record<string, number> = {};
        for (const [key, value] of Object.entries(r.scoresByTaskType)) {
          if (Number.isFinite(value)) metrics[key] = value * 100;
        }
        const addPart = (name: string, value: number, group: string, key: string) => {
          if (!Number.isFinite(value)) return;
          metrics[key] = value * 100;
          parts[key] = {name, group};
        };
        for (const [name, value] of Object.entries(r.scoresByTask ?? {})) addPart(name, value, 'Task', keyOf(name));
        for (const [group, scores] of Object.entries(r.scoresByCustomGroup ?? {})) {
          for (const [name, value] of Object.entries(scores)) addPart(name, value, group, keyOf(group + ' ' + name));
        }
        for (const [key, value] of Object.entries({
          activeParamsB: r.activeParamsB, maxTokens: r.maxTokens, embeddingDim: r.embeddingDim,
          zeroShotPct: r.zeroShotPct, opennessScore: r.model.opennessScore,
        })) {
          if (typeof value === 'number' && Number.isFinite(value) && value >= 0) metrics[key] = value;
        }
        if (typeof r.meanTaskType === 'number') metrics.meanTaskType = r.meanTaskType * 100;
        if (typeof r.meanPublic === 'number') addPart('Public', r.meanPublic, 'Split', 'meanPublic');
        if (typeof r.meanPrivate === 'number') addPart('Private', r.meanPrivate, 'Split', 'meanPrivate');
        return {
          model: r.model.name, setting: 'RTEB beta, all tasks', score: r.meanTask * 100, metrics,
          params: r.totalParamsB ?? undefined, open: r.model.openWeights ?? undefined,
          license: r.model.license || undefined,
        };
      });
      board.parts = parts;
      if (!result.length) throw new Error('No RTEB task scores');
      return result;
  },
};
export default board;
