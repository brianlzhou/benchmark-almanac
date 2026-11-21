// Labelbox ranks search-enabled models by overall score on 200 questions. Its page payload includes each model's six domain scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/agentic-search/";

const board: Leaderboard = {
  benchmark: "agentic-search-labelbox",
  url: "https://labelbox.com/leaderboards/agentic-search/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots.txt restrictions cover CGI and PDF paths.",
  aliases: { 'Google Gemini 2.5 Pro': 'gemini-2-5-pro-jun-2025', 'OpenAI GPT-4.1': 'gpt-4-1', 'Anthropic Claude 4.0 Opus': 'claude-opus-4' },
  async fetch() {
    type Entry = { label: string; overall_score: number };
    const data = await labelboxData(feed, 'agentic-search') as { overall: Entry[]; order: string[]; info: Record<string, Record<string, Entry>> };
    const keys = data.order.filter(k => k !== 'aggregate_performance');
    if (keys.length < 6 || data.overall.length < 3) throw new Error('Incomplete agentic search leaderboard');
    board.parts = Object.fromEntries(keys.map(k => [k, k.replaceAll('_', ' ')]));
    return data.overall.map(r => {
      const metrics: Record<string, number> = {};
      for (const key of keys) {
        const score = Object.values(data.info[key]).find(v => v.label === r.label)?.overall_score;
        if (score == null || !Number.isFinite(score)) throw new Error('Missing search domain ' + key);
        metrics[key] = score;
      }
      if (!Number.isFinite(r.overall_score)) throw new Error('Missing overall search score');
      return { model: r.label.replace(' (Search)', ''), setting: 'Search', score: r.overall_score, metrics };
    });
  },
};

export default board;
