// OutboundEval from Xbench evaluates language models in simulated outbound calls.
// The headline is the paper's Total Score on a 0 to 1 scale, with task flow and interaction scores as metrics.
// This importer reads the result table in the project's README.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const board: Leaderboard = {
  benchmark: 'outboundeval-xbench',
  url: 'https://github.com/LVYUERLVR/OutboundEval-Xbench',
  feed: 'https://raw.githubusercontent.com/LVYUERLVR/OutboundEval-Xbench/main/README.md (Result table)',
  terms: 'The repository does not state a data license. Results are credited to Meituan, Xbench and Agora.',
  static: 'paper',
  parts: {
    taskFlowCompliance: { name: 'Task Flow Compliance Score', group: 'Dimension', unit: 'score' },
    generalInteractionCapability: { name: 'General Interaction Capability Score', group: 'Dimension', unit: 'score' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    return [
      ['doubao-1.5-32k (ByteDance, 2025)', 0.8881, 0.8331, 0.9554],
      ['gpt-4.1 (OpenAI, 2025)', 0.8818, 0.8204, 0.9568],
      ['claude-4-sonnet (Anthropic, 2025b)', 0.8748, 0.8339, 0.9248],
      ['gemini-2.5-flash (Comanici et al., 2025)', 0.8719, 0.8016, 0.9578],
      ['qwen3-32b-base (Yang et al., 2025)', 0.8672, 0.7986, 0.951],
      ['gpt-4o (OpenAI, 2024)', 0.8606, 0.8072, 0.9258],
      ['claude-3.5-sonnet (Anthropic, 2024)', 0.8448, 0.7764, 0.9283],
      ['gemini-2.5-pro (Comanici et al., 2025)', 0.8438, 0.7544, 0.953],
      ['deepseek-v3 (DeepSeek-AI et al., 2025b)', 0.8195, 0.7683, 0.8821],
      ['claude-3.7-sonnet (Anthropic, 2025a)', 0.8162, 0.7522, 0.8944],
      ['deepseek-r1 (DeepSeek-AI et al., 2025a)', 0.7984, 0.7767, 0.825],
      ['kimi-k2-instruct (Kimi-Team et al., 2025)', 0.7904, 0.7095, 0.8894],
    ].map(([model, score, taskFlowCompliance, generalInteractionCapability]) => ({
      model: model as string,
      score: score as number,
      metrics: { taskFlowCompliance: taskFlowCompliance as number, generalInteractionCapability: generalInteractionCapability as number },
    }));
  },
};

export default board;
