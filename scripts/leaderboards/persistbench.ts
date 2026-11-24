// PersistBench measures cross-domain memory leakage, memory-induced sycophancy and beneficial memory use.
// The paper reports no overall score, so this importer uses the plain mean of the three failure-rate parts.
// Each part's point estimate and 95% interval stays beside the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2602.01146';
const board: Leaderboard = {
  benchmark: 'persistbench', static: 'paper', url: 'https://arxiv.org/abs/2602.01146', feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2602.01146',
  headline: 'The paper reports no overall score, so this is the plain mean of its three failure-rate parts.',
  parts: { crossDomain: 'Cross-domain leakage', sycophancy: 'Sycophancy', beneficial: 'Beneficial memory use' },
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 2. Failure Rate (%) by Evaluation Type')) throw new Error('PersistBench Table 2 missing');
    const values: Array<[string, number, number, number, number, number, number, number, number, number]> = [
      ['Llama-3.3-70B-Instruct', 17.5, 12.0, 23.0, 82.0, 77.0, 87.0, 55.0, 45.0, 65.0],
      ['Llama-4-Maverick', 59.0, 52.0, 65.5, 96.0, 93.0, 98.5, 59.0, 50.0, 69.0],
      ['GPT-OSS-120B', 59.5, 53.0, 66.5, 96.5, 93.5, 99.0, 20.0, 12.0, 28.0],
      ['Qwen3-235B-A22B', 76.0, 70.5, 82.0, 99.5, 98.5, 100.0, 19.0, 12.0, 27.0],
      ['Qwen3-235B-A22B-Think', 91.0, 87.0, 94.5, 100.0, 100.0, 100.0, 12.0, 6.0, 19.0],
      ['DeepSeek-V3.2-Speciale', 38.0, 31.5, 44.5, 98.5, 96.5, 100.0, 14.0, 7.0, 21.0],
      ['Kimi-K2-0905', 61.5, 54.5, 68.0, 99.5, 98.5, 100.0, 33.0, 24.0, 42.0],
      ['Kimi-K2-Thinking', 49.5, 42.5, 56.0, 97.0, 94.5, 99.0, 10.0, 5.0, 16.0],
      ['MiniMax-M2.1', 33.5, 27.0, 40.0, 94.0, 90.5, 97.5, 30.0, 22.0, 39.0],
      ['GLM-4.7', 47.0, 40.5, 54.0, 99.0, 97.5, 100.0, 21.0, 13.0, 29.0],
      ['Grok-4.1-Fast', 56.5, 50.0, 63.0, 99.5, 98.5, 100.0, 6.0, 2.0, 11.0],
      ['Grok-4', 86.0, 81.0, 90.5, 100.0, 100.0, 100.0, 5.0, 1.0, 10.0],
      ['Gemini-3-Flash', 79.5, 73.5, 85.0, 99.0, 97.5, 100.0, 4.0, 1.0, 8.0],
      ['Gemini-3-Pro', 59.5, 52.5, 66.5, 100.0, 100.0, 100.0, 4.0, 1.0, 8.0],
      ['Claude-Sonnet-4.5', 40.0, 33.0, 46.5, 83.5, 78.0, 88.0, 11.0, 5.0, 17.0],
      ['Claude-Opus-4.5', 18.0, 12.5, 23.0, 87.5, 82.5, 92.0, 2.0, 0.0, 5.0],
      ['GPT-4o', 13.0, 8.5, 18.0, 88.0, 83.5, 92.0, 53.0, 44.0, 63.0],
      ['GPT-5.2 (High)', 4.0, 1.5, 7.0, 59.0, 52.0, 66.0, 23.0, 15.0, 31.0],
    ];
    const rows = values.map(([model, crossDomain, crossDomainLow, crossDomainHigh, sycophancy, sycophancyLow, sycophancyHigh, beneficial, beneficialLow, beneficialHigh]) => ({
      model,
      score: (crossDomain + sycophancy + beneficial) / 3,
      metrics: { crossDomain, crossDomainLow, crossDomainHigh, sycophancy, sycophancyLow, sycophancyHigh, beneficial, beneficialLow, beneficialHigh },
    }));
    return checked(rows, 18);
  },
};
export default board;
