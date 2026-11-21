// Kaggle Standardized Agent Exams ranks agents that answer 16 multistep reasoning and safety questions.
// The score is the agent's best exam percentage, and the feed also reports how many exams it completed.
// This importer reads Kaggle's public TopAgents JSON endpoint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://www.kaggle.com/experimental/sae';
const FEED = 'https://www.kaggle.com/api/v1/agentExam/TopAgents';

interface Agent {
  agentName?: string;
  model?: string;
  bestScore?: number;
  totalExams?: number;
}
interface Response { agents?: Agent[]; totalCount?: number }

const board: Leaderboard = {
  benchmark: 'standardized-agent-exams-kaggle',
  url: PAGE,
  feed: FEED,
  terms: "Kaggle's public leaderboard endpoint. Kaggle's terms of use apply.",
  reference: ['Agent'],
  harnesses: 'system',
  async fetch() {
    const data = await fetchJson<Response>(FEED);
    if (!data.agents || data.agents.length !== 25) throw new Error(`Kaggle Standardized Agent Exams: ${data.agents?.length ?? 0} rows, expected 25`);
    return data.agents.map((agent) => {
      if (!agent.agentName || !agent.model || typeof agent.bestScore !== 'number' || typeof agent.totalExams !== 'number') throw new Error('Kaggle Standardized Agent Exams: incomplete row');
      return { model: agent.model, harness: agent.agentName, score: agent.bestScore, metrics: { totalExams: agent.totalExams } };
    });
  },
};

export default board;
