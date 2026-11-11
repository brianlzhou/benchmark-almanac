// DeepResearch Bench (USTC and Metastone). The muset-ai/DeepResearch-Bench-Leaderboard Space reads
// data/leaderboard.csv from its own repository: per system the RACE overall_score (report quality against
// reference reports, 0 to 100), its four parts and, for some rows, FACT citation metrics. overall_score is
// the score. Use only the latest GPT-5.5 judge release. The earlier Gemini judge has a different scale.
// Sonar Reasoning remains an unlisted research product.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard/resolve/main/data_gpt55/leaderboard.csv';

const AGENT_ON_MODEL: Record<string, [string, string]> = {
  'langchain-open-deep-research-gpt-5': ['gpt-5', 'LangChain Open Deep Research'],
  'gensee-search-gpt-5': ['gpt-5', 'Gensee Search'],
};

const board: Leaderboard = {
  benchmark: 'deepresearch-bench',
  url: 'https://huggingface.co/spaces/muset-ai/DeepResearch-Bench-Leaderboard',
  feed: `${FEED} (overall_score; GPT-5.5 judge)`,
  terms: 'CSV in the muset-ai/DeepResearch-Bench-Leaderboard Hugging Face Space, licensed Apache-2.0.',
  aliases: {
    'openai-deepresearch': 'deep-research',
    'gemini-2.5-pro-preview-05-06': 'gemini-2-5-pro-may-2025',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const [feed, judge] of [[FEED, 'GPT-5.5 judge']]) {
    if (feed !== FEED) await new Promise(resolve => setTimeout(resolve, 2100));
    for (const r of parseCsv(await fetchText(feed))) {
      const score = Number(r.overall_score);
      const name = r.model?.trim();
      if (!name || !r.overall_score?.trim() || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const key of ['comprehensiveness', 'insight', 'instruction_following', 'readability', 'citation_accuracy', 'effective_citations']) {
        const value = r[key]?.trim();
        if (value && Number.isFinite(Number(value))) metrics[key] = Number(value);
      }
      const pair = AGENT_ON_MODEL[name];
      rows.push(pair ? { model: pair[0], harness: pair[1], score, metrics, setting: judge } : { model: name === 'sonar-reasoning' ? 'sonar-reasoning (research product)' : name, score, metrics, setting: judge });
    }
    }
    return rows;
  },
};
export default board;
