// The Company Search Benchmark compares search engines on company research queries.
// Its headline score is answer quality averaged across queries, reported as a percentage in Tavily's comparison post.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://www.tavily.com/blog/your-agent-has-the-company-name-how-much-can-it-actually-tell-you-about-it';
const line = /((?:tavily|parallel|exa|keenable|perplexity|brave|linkup|firecrawl-v2|you) \/ (?:advanced|auto|default|llm-context|standard)),(0\.\d+),(0\.\d+),(0\.\d+),(0\.\d+)/g;

const board: Leaderboard = {
  benchmark: 'tavily-company-search-benchmark',
  url: 'https://www.tavily.com/knowledge/company',
  feed: FEED,
  static: 'paper',
  parts: {
    profiles: 'Profiles',
    financials: 'Financials',
    newsMarkets: 'News & Markets',
  },
  terms: 'Tavily publishes the comparison and the benchmark dataset. The post gives no separate result reuse license. https://www.tavily.com/blog/your-agent-has-the-company-name-how-much-can-it-actually-tell-you-about-it',
  async fetch() {
    const text = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    for (const m of text.matchAll(line)) {
      const [, name, overall, profiles, financials, newsMarkets] = m;
      const [model, setting] = name.split(' / ');
      rows.push({
        model,
        setting,
        score: Number(overall) * 100,
        metrics: {
          profiles: Number(profiles) * 100,
          financials: Number(financials) * 100,
          newsMarkets: Number(newsMarkets) * 100,
        },
      });
    }
    if (rows.length !== 9) throw new Error(`Company Search Benchmark: expected 9 providers, found ${rows.length}`);
    return rows;
  },
};
export default board;
