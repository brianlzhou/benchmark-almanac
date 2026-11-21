// HearingBench asks models to identify 100 sounds from spectrogram images across five 20-clip tiers.
// The headline score is the number of clips answered correctly out of 100.
// This importer reads the scored rows in the leaderboard page's HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://hearing-bench.adamholter.chatgpt.site/';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
const board: Leaderboard = {
  benchmark: 'hearingbench',
  url: PAGE,
  feed: PAGE,
  terms: 'The page links the source datasets and gives no separate benchmark license. Results are credited to Adam Holter and HearingBench.',
  aliases: {
    'Gemini 4 Carbon': 'gemini-4-carbon',
    'Gemini 4 Neon': 'gemini-4-neon',
    'Gemini 4 Argon': 'gemini-4-argon',
    'Gemini 4 Hydrogen': 'gemini-4-hydrogen',
    'Gemini 3.8 Flash': 'gemini-3-8-flash',
    'Claude Opus 5.5': 'claude-opus-5-5',
    'Claude Fable 5.2': 'claude-fable-5-2',
    'Claude Sonnet 5.5': 'claude-sonnet-5-5',
    'Claude Haiku 5.5': 'claude-haiku-5-5',
    'GPT-6.2 Astra': 'gpt-6-2-astra',
    'GPT-6.2 Sol': 'gpt-6-2-sol',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'GPT-6.1 Terra': 'gpt-6-1-terra',
    'GPT-6 Luna': 'gpt-6-luna',
    'Grok 4.7': 'grok-4-7',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const boardHtml = html.match(/<ol class="board">([\s\S]*?)<\/ol>/)?.[1];
    if (!boardHtml) throw new Error('HearingBench: leaderboard rows missing');
    const rows: LeaderboardRow[] = [];
    for (const block of boardHtml.matchAll(/<li class="row(?: [^"]+)?">([\s\S]*?)<\/li>/g)) {
      const body = block[1];
      const name = body.match(/class="model-name">([^<]+)</)?.[1]?.trim();
      const effort = body.match(/class="eff [^"]+">([^<]+)</)?.[1]?.trim();
      const score = body.match(/class="score num">(\d+)</)?.[1];
      if (!name || !effort || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const tierNames = ['everyday', 'instrument', 'vocal', 'words', 'sentences'];
      const tips = [...body.matchAll(/data-tip="<b>([^<]+)<\/b><br>(\d+) of 20 correct, (\d+) near misses/g)];
      tips.slice(0, 5).forEach((m, i) => { metrics[tierNames[i]] = Number(m[2]); metrics[`${tierNames[i]}NearMisses`] = Number(m[3]); });
      const harness = body.match(/<small>([^<]+)<\/small>/)?.[1]?.replace(/Â·/g, '·').split('·').pop()?.trim();
      rows.push({ model: name, setting: effort, harness, score: Number(score), metrics });
    }
    if (rows.length < 16) throw new Error(`HearingBench: ${rows.length} scored rows, expected at least 16`);
    return rows;
  },
};
export default board;
