// NewsGuard audited three voice assistants on sixty prompts each. Its report gives the percentage repeating a false claim across all prompt styles.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://www.newsguardtech.com/special-reports/chatgpt-and-gemini-readily-produce-false-audio-claims-while-alexa-declines/";

const board: Leaderboard = {
  benchmark: "newsguard-false-audio-claims",
  url: "https://www.newsguardtech.com/special-reports/chatgpt-and-gemini-readily-produce-false-audio-claims-while-alexa-declines/",
  feed,
  static: 'paper',
  terms: "NewsGuard publishes the chart and keeps the underlying False Claim Fingerprints database proprietary. The report gives no score reuse license. https://www.newsguardtech.com/special-reports/chatgpt-and-gemini-readily-produce-false-audio-claims-while-alexa-declines/ The feed host publishes robots.txt at https://www.newsguardtech.com/robots.txt.",
  stats: {
    repeated: { name: 'Repeated false claims', unit: 'count', better: 'lower' },
  },
  async fetch() {
    const article = text(await fetchText(feed));
    const rows: LeaderboardRow[] = [];
    for (const [label, model] of [['Gemini', 'Gemini Live'], ['ChatGPT', 'ChatGPT Voice']]) {
      const match = article.match(new RegExp(label + ' repeated false claims (\\d+) percent of the time \\((\\d+) (?:out of|of) (\\d+)\\)'));
      if (!match) throw new Error('Missing overall rate for ' + model);
      rows.push({ model, score: +match[1], metrics: { repeated: +match[2] } });
    }
    if (!article.includes('Alexa+ declined every time')) throw new Error('Missing Alexa+ result');
    rows.push({ model: 'Alexa+', score: 0, metrics: { repeated: 0 } });
    return rows;
  },
};
export default board;
