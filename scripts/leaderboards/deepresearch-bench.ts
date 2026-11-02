// DeepResearch Bench (USTC and Metastone). The muset-ai/DeepResearch-Bench-Leaderboard Space reads
// data/leaderboard.csv from its own repository: per system the RACE overall_score (report quality against
// reference reports, 0 to 100), its four parts and, for some rows, FACT citation metrics. overall_score is
// the score. Most rows are deep research products or agent systems, not models, so most stay unmatched. Two
// names put an agent on a named model ("langchain-open-deep-research-gpt-5", "gensee-search-gpt-5"): the
// model is the model and the agent the harness. Epoch AI also runs this benchmark on plain models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data/leaderboard.csv';

const AGENT_ON_MODEL: Record<string, [string, string]> = {
  'langchain-open-deep-research-gpt-5': ['gpt-5', 'LangChain Open Deep Research'],
  'gensee-search-gpt-5': ['gpt-5', 'Gensee Search'],
};

const board: Leaderboard = {
  benchmark: 'deepresearch-bench',
  url: 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard',
  feed: `${FEED} (overall_score)`,
  terms: 'CSV in the muset-ai/DeepResearch-Bench-Leaderboard Hugging Face Space, licensed Apache-2.0.',
  aliases: {
    'openai-deepresearch': 'deep-research',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const score = Number(r.overall_score);
      const name = r.model?.trim();
      if (!name || !Number.isFinite(score)) continue;
      const pair = AGENT_ON_MODEL[name];
      rows.push(pair ? { model: pair[0], harness: pair[1], score } : { model: name, score });
    }
    return rows;
  },
};
export default board;
