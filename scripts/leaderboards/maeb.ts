// MAEB v1: default Mean(Task), scaled to the displayed 0-to-100 score.
// The current API renamed the beta benchmark. Only published whole-benchmark aggregates qualify. Keep model metadata, embedding dimensions, task and group scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MAEB%28v1%29/scores";
const board: Leaderboard = {
  benchmark: "maeb",
  parts: {
    AudioReranking: { name: 'Audio reranking', group: 'Task type' },
    AudioClassification: { name: 'Audio classification', group: 'Task type' },
    Any2AnyRetrieval: { name: 'Any-to-any retrieval', group: 'Task type' },
    AudioClustering: { name: 'Audio clustering', group: 'Task type' },
    AudioPairClassification: { name: 'Audio pair classification', group: 'Task type' },
    AudioMultilabelClassification: { name: 'Audio multilabel classification', group: 'Task type' },
    AudioZeroshotClassification: { name: 'Audio zero-shot classification', group: 'Task type' },
  },
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MAEB%28v1%29/scores",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  stats: { activeParamsB:{name:'Active parameters',unit:'billions'}, maxTokens:{name:'Maximum tokens',unit:'tokens'}, embeddingDim:{name:'Embedding dimensions',unit:'count'}, zeroShotPct:{name:'Zero-shot percentage',unit:'%',better:'higher'}, opennessScore:{name:'Openness score',unit:'score',better:'higher'}, meanTaskType:{name:'Mean task-type score',unit:'%',better:'higher'} },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const data = await fetchJson<{
        rows: {
          model: {name: string; openWeights?: boolean; license?: string; opennessScore?: number};
          meanTask: number; meanTaskType?: number; meanPrivate?: number; meanPublic?: number;
          activeParamsB?: number; totalParamsB?: number; maxTokens?: number; embeddingDim?: number; zeroShotPct?: number;
          scoresByTaskType: Record<string, number>; scoresByTask?: Record<string, number>;
          scoresByCustomGroup?: Record<string, Record<string, number>>;
        }[];
      }>(FEED);
      const parts = board.parts ?? {};
      const keyOf = (label: string) => label.replace(/^[A-Z]/, c => c.toLowerCase())
        .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '');
      const result = data.rows.filter(r => typeof r.meanTask === 'number').map(r => {
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
          model: r.model.name.replace(/^[^/]+\//, ''), score: r.meanTask * 100, metrics,
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
board.parts = { ...board.parts, ...Object.fromEntries(['vehicleSoundClustering','mInDS14','commonVoiceMini21T2ARetrieval','gTZANGenre','sIBFLEURS','speechCommandsZeroshotv002','voxCelebSA','voxPopuliAccentPairClassification','iEMOCAPGender','beijingOpera','fSD2019Kaggle','jamAltLyricA2TRetrieval','nMSQAPairClassification','birdCLEF','commonLanguageAgeDetection','fleursT2ARetrieval','cREMADClustering','jamAltArtistA2ARetrieval','ravdessZeroshot','cREMAD','voxPopuliGenderClustering','voxPopuliLanguageID','cREMADPairClassification','mridinghamTonic','gTZANAudioReranking','mACST2ARetrieval','gigaSpeechT2ARetrieval','urbanSound8KT2ARetrieval','spokenSQuADT2ARetrieval','clothoT2ARetrieval','benchmarkVariantAudioOnly'].map(key => [key, { name: key, group: 'Task' }])) };
export default board;
