// MIEB Multilingual: current default Mean(TaskType), scaled to the displayed 0-to-100 score.
// Only rows with a published whole-benchmark aggregate qualify. Keep the published model metadata and task breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28Multilingual%29/scores";
const board: Leaderboard = {
  benchmark: "mieb",
  stats: { activeParamsB: { name: 'Active parameters', unit: 'billions' }, maxTokens: { name: 'Maximum tokens', unit: 'tokens' }, embeddingDim: { name: 'Embedding dimensions', unit: 'count' }, opennessScore: { name: 'Openness score', unit: 'score', better: 'higher' }, meanTask: { name: 'Mean task score', unit: '%', better: 'higher' } },
  parts: {
    ImageClassification: { name: 'Image classification', group: 'Task type' },
    DocumentUnderstanding: { name: 'Document understanding', group: 'Task type' },
    Any2AnyRetrieval: { name: 'Any to any retrieval', group: 'Task type' },
    ZeroShotClassification: { name: 'Zero shot classification', group: 'Task type' },
    VisionCentricQA: { name: 'Vision centric question answering', group: 'Task type' },
    Any2AnyMultilingualRetrieval: { name: 'Any to any multilingual retrieval', group: 'Task type' },
    ImageClustering: { name: 'Image clustering', group: 'Task type' },
    Compositionality: { name: 'Compositionality', group: 'Task type' },
    'VisualSTS(eng)': { name: 'Visual semantic textual similarity, English', group: 'Task type' },
    'VisualSTS(multi)': { name: 'Visual semantic textual similarity, multilingual', group: 'Task type' },
  },
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28Multilingual%29/scores",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const data = await fetchJson<{
        rows: {
          model: {name: string; openWeights?: boolean; license?: string; opennessScore?: number};
          meanTask?: number; meanTaskType: number; meanPrivate?: number; meanPublic?: number;
          activeParamsB?: number; totalParamsB?: number; maxTokens?: number; embeddingDim?: number; zeroShotPct?: number;
          scoresByTaskType: Record<string, number>; scoresByTask?: Record<string, number>;
          scoresByCustomGroup?: Record<string, Record<string, number>>;
        }[];
      }>(FEED);
      const parts = board.parts ?? {};
      const keyOf = (label: string) => label.replace(/^[A-Z]/, c => c.toLowerCase())
        .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
      const result = data.rows.filter(r => typeof r.meanTaskType === 'number').map(r => {
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
          opennessScore: r.model.opennessScore,
        })) {
          if (typeof value === 'number' && Number.isFinite(value) && value >= 0) metrics[key] = value;
        }
        if (typeof r.meanTask === 'number') metrics.meanTask = r.meanTask * 100;
        if (typeof r.meanPublic === 'number') addPart('Public', r.meanPublic, 'Split', 'meanPublic');
        if (typeof r.meanPrivate === 'number') addPart('Private', r.meanPrivate, 'Split', 'meanPrivate');
        return {
          model: r.model.name.replace(/^[^/]+\//, ''), score: r.meanTaskType * 100, metrics,
          params: r.totalParamsB ?? undefined, open: r.model.openWeights ?? undefined,
          license: r.model.license || undefined,
        };
      });
      board.parts = parts;
      return result;
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
