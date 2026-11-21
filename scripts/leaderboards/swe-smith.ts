// SWE-smith evaluates software-engineering agents on SWE-bench Lite and Verified.
// Table 3 reports pass@1 resolve rates for named model and agent-system pairs.
// The Verified resolve rate is the headline and Lite remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/pdf/2504.21798';
const board: Leaderboard = {
  benchmark: 'swe-smith', static: 'paper', url: 'https://arxiv.org/abs/2504.21798', feed,
  headline: 'Table 3 lists SWE-bench Verified first in the benchmark record, so this is the Verified pass@1 resolve rate.',
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2504.21798',
  async fetch(): Promise<LeaderboardRow[]> {
    const text = await pdfText(feed);
    if (!text.includes('Table 3: Resolve rates for existing solutions on SWE-bench Lite and Verified')) throw new Error('SWE-smith Table 3 missing');
    const values: Array<[string, string, number | null, number]> = [
      ['GPT-4o', 'Agentless', 32.0, 38.8], ['GPT-4o', 'SWE-agent', 18.3, 23.0],
      ['Claude 3.5 Sonnet', 'Agentless', 40.7, 50.8], ['Claude 3.5 Sonnet', 'AutoCodeRover', null, 46.2], ['Claude 3.5 Sonnet', 'OpenHands', 41.7, 53.0], ['Claude 3.5 Sonnet', 'SWE-agent', 23.0, 33.6],
      ['Claude 3.7 Sonnet', 'SWE-agent', 48.0, 58.2], ['Llama3-SWE-RL-70B', 'Agentless', null, 41.0], ['Lingma-SWE-GPT-72B', 'SWE-SynInfer', null, 28.8],
      ['Qwen3-235B-A22B', 'OpenHands', null, 34.4], ['R2E-Gym-32B', 'OpenHands', null, 34.4], ['SWE-fixer-72B', 'SWE-Fixer', 24.7, 32.8], ['SWE-gym-32B', 'OpenHands', 15.3, 20.6],
      ['SWE-agent-LM-7B', 'SWE-agent', 11.7, 15.2], ['SWE-agent-LM-32B', 'SWE-agent', 30.7, 40.2],
    ];
    const rows = values.map(([model, harness, lite, verified]) => ({ model, harness, score: verified, metrics: { ...(lite == null ? {} : { lite }), verified } }));
    return checked(rows, 15);
  },
};
export default board;
