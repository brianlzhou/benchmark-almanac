// Questflow ranks trading accounts by weekly profit in USDC. Its page embeds the current standings.
// Include accounts that make trading decisions and identify their model consistently.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://next.questflow.ai/leaderboard';
const board: Leaderboard = {
  benchmark: 'questflow-traders-arena', url, feed: url,
  terms: 'Questflow publishes the standings on its public trader leaderboard. https://next.questflow.ai/leaderboard',
  headline: 'Questflow ranks accounts by weekly profit in USDC.',
  stats: {
    weeklyRoi: { name: 'Weekly ROI', unit: '%', better: 'higher' },
    volume: { name: 'Trading volume', unit: 'usd' },
    accountValue: { name: 'Account value', unit: 'usd', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(url);
    const payload = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!payload) throw new Error('Missing Questflow standings');
    const arena = JSON.parse(payload).props.pageProps.initialArenaBoard;
    if (arena.totalCount !== arena.ranking.length) throw new Error('Incomplete Questflow standings');
    const rows: LeaderboardRow[] = [];
    for (const account of arena.ranking) {
      if (account.traderRole !== 'model' || /^Fades every position/i.test(account.bio)) continue;
      const name = account.username.replace(/ (Whale|Breakout)$/, '');
      const match = account.bio.match(/^(?:Google's |Moonshot's )?(MiniMax M3|Gemini 3\.1 Pro Preview|Kimi K3)\b/i);
      const model = name === 'GPT 5.6' && account.bio.includes('GPT 5.6 SOL') ? 'GPT 5.6 SOL' : /^Tim\d/i.test(name) ? match?.[1] : name;
      if (!model || !account.bio.toLowerCase().includes(model.toLowerCase())) continue;
      const {weeklyPnl, weeklyRoi, volume, accountValue} = account;
      if (![weeklyPnl, weeklyRoi, volume, accountValue].every(Number.isFinite)) throw new Error('Missing trader metrics');
      rows.push({model, score: weeklyPnl, setting: arena.weekStartAt.slice(0, 10) + ' weekly contest, ' + account.profilePath,
        harness: account.username.endsWith(' Whale') ? 'Whale Signals' : account.username.endsWith(' Breakout') ? 'Platform Breakout' : undefined,
        link: new URL(account.profilePath, url).href, metrics: {weeklyRoi: weeklyRoi * 100, volume, accountValue}});
    }
    return checked(rows, 17);
  },
};
export default board;
