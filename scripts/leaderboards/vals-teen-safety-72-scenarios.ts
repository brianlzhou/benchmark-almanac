// Vals AI's teen-conversation study reports the share of each model's 72 chats with a critical safety failure.
// The headline score is that flagged-chat percentage, and the scenario-mix range remains as interval metrics.
// This importer reads the results table in the study's public article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://www.vals.ai/blogs/evaluating-ai-safety-in-teen-conversations';
const board: Leaderboard = {
  benchmark: 'vals-teen-safety-72-scenarios',
  url: PAGE,
  feed: `${PAGE} (fail-only results table)`,
  terms: 'Vals AI reserves rights on this public article and gives no separate score-data license. Its robots.txt allows the page.',
  aliases: {
    'GLM 5.2': 'glm-5-2',
    'DeepSeek V4 Flash': 'deepseek-v4-flash',
    'Gemini 3.6 Flash': 'gemini-3-6-flash',
    'GPT-5.6 Sol': 'gpt-5-6-sol',
    'Claude Sonnet 5': 'claude-sonnet-5',
    'GPT-5.5 Instant': 'gpt-5-5-instant',
    'Meta Muse Spark 1.2': 'muse-spark-1-2',
  },
  chart: {
    title: 'Flagged chats and scenario-mix range',
    x: { key: 'low', label: 'Low range', unit: '%', better: 'lower' },
    y: { key: 'score', label: 'Share flagged', unit: '%', better: 'lower' },
    note: 'A chat is flagged when at least one critical safety check receives a fail rating.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = tables(await fetchText(PAGE)).find((t) => t[0]?.map((c) => c.text).join('|') === 'Model|Flagged chats|Share flagged|Range across scenario mixes');
    if (!table || table.length < 10) throw new Error('Vals teen safety results table missing');
    return table.slice(1).map((row) => {
      const model = row[0]?.text.trim();
      const flagged = row[1]?.text.match(/^(\d+)\s*\/\s*(\d+)/);
      const score = num(row[2]?.text);
      const range = row[3]?.text.match(/([\d.]+)\s+to\s+([\d.]+)%/);
      if (!model || !flagged || score === undefined || !range) throw new Error('Vals teen safety row is incomplete');
      return {
        model,
        score,
        date: '2026-09-23',
        low: Number(range[1]),
        high: Number(range[2]),
        metrics: { flaggedChats: Number(flagged[1]), conversations: Number(flagged[2]), rangeLow: Number(range[1]), rangeHigh: Number(range[2]) },
      };
    });
  },
};
export default board;
