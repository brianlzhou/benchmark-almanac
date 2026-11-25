// AnvilBench (Kaggle Benchmarks, by vikramtiwari): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'anvilbench',
  url: 'https://www.kaggle.com/benchmarks/vikramtiwari/anvilbench',
  feed: kaggleFeed('vikramtiwari', 'anvilbench'),
  terms: KAGGLE_TERMS,
  parts: {
    quantizationGemv: 'LLM quantization and GEMV',
    attentionKv: 'Attention, KV, and speculative decoding',
    trainingRl: 'Training, RL, and alignment',
    vision3d: 'Vision, video, 3D, and ISP',
    audioDsp: 'Audio, speech, and DSP',
    tabularGnnRag: 'Tabular, GNN, and RAG',
    databasesCrypto: 'Databases, crypto, and coding',
    scienceFinance: 'Science, finance, and physics',
  },
  fetch: () => kaggleRowsWithBounds('vikramtiwari', 'anvilbench', "(Overall)", 1, {
    quantizationGemv: { task: 'AnvilBench LLM Quantization GEMV' },
    attentionKv: { task: 'AnvilBench Attention KV Speculative' },
    trainingRl: { task: 'AnvilBench Training RL Alignment' },
    vision3d: { task: 'AnvilBench Vision Video 3D ISP' },
    audioDsp: { task: 'AnvilBench Audio Speech DSP' },
    tabularGnnRag: { task: 'AnvilBench Tabular GNN RAG' },
    databasesCrypto: { task: 'AnvilBench Databases Crypto Coding' },
    scienceFinance: { task: 'AnvilBench Science Finance Physics' },
  }),
};
export default board;
