// Bench on the Clocktower (Tom Taylor and coauthors, LessWrong, 2026-09-30): 10 models, each in every one of
// 300 ten-player games of Blood on the Clocktower, one seat per model. The post publishes its results only as
// chart images, so the rows below are transcribed from the labels of its "Raw team-win ranking" chart: the share
// of games each model's team won, with Wilson 95% intervals. Every model plays in every game, so the good-team
// and evil-team rankings are the same by construction. The 300 game logs are public on GitHub, but the board is
// the post's chart. fetch() checks that the post still carries the chart before it returns the rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const POST = 'https://www.lesswrong.com/posts/4pgGkbwvdmxKPcJsM/bench-on-the-clocktower';
const CHART = 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1790323324/lexical_client_uploads/zladdbqfjjcqlrwjjdlg.png';

const RATES: [string, number][] = [
  ['GPT-5.6 Sol', 58.0],
  ['Claude Opus 5', 55.3],
  ['Claude Fable 5', 52.7],
  ['Gemini 3.1 Pro', 52.0],
  ['Grok 4.5', 50.0],
  ['Kimi K3', 49.3],
  ['GPT-5.6 Terra', 48.7],
  ['DeepSeek V4 Pro', 48.0],
  ['Gemini 3.6 Flash', 46.7],
  ['Qwen3.6-35B-A3B', 42.0],
];

const board: Leaderboard = {
  benchmark: 'bench-on-the-clocktower',
  url: POST,
  feed: `${CHART} (chart labels transcribed 2026-11-05)`,
  terms: "Read once through LessWrong's public GraphQL API to confirm the chart; the win rates are cited to the post's authors.",
  async fetch() {
    const res = await fetchText('https://www.lesswrong.com/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ post(input:{selector:{_id:"4pgGkbwvdmxKPcJsM"}}){ result { contents { html } } } }' }),
    });
    if (!res.includes('zladdbqfjjcqlrwjjdlg')) throw new Error('the Bench on the Clocktower post no longer carries the ranking chart');
    return RATES.map(([model, score]): LeaderboardRow => ({ model, score, date: '2026-09-30' }));
  },
};
export default board;
