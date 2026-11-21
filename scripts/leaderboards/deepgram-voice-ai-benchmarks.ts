// Deepgram's voice AI benchmark page compares speech-to-text models on multilingual batch word error rate.
// The headline score is the batch WER percentage, where lower is better.
// This importer reads the first comparison table from the page's server-rendered HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://deepgram.com/benchmarks';
const board: Leaderboard = {
  benchmark: 'deepgram-voice-ai-benchmarks',
  url: PAGE,
  feed: PAGE,
  terms: 'Deepgram publishes the comparison page without a separate data reuse license. Results are credited to Deepgram.',
  async fetch() {
    const html = await fetchText(PAGE);
    const start = html.indexOf('Most accurate on recorded audio');
    const end = html.indexOf('Multilingual batch WER, best of ten vendors', start);
    if (start < 0 || end < 0) throw new Error('Deepgram benchmarks: batch comparison section missing');
    const section = html.slice(start, end);
    const re = /<span[^>]*>([^<]+)<\/span><span[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*>(\d+\.\d+)<\/span>/g;
    const rows: LeaderboardRow[] = [];
    for (const m of section.matchAll(re)) {
      const provider = m[1].trim();
      const model = m[2].trim();
      const score = Number(m[3]);
      if (!provider || !model || !Number.isFinite(score) || rows.some((r) => r.model === `${provider} ${model}`)) continue;
      rows.push({ model: `${provider} ${model}`, score });
    }
    if (rows.length < 5) throw new Error(`Deepgram benchmarks: ${rows.length} batch models, expected at least 5`);
    return rows;
  },
};
export default board;
