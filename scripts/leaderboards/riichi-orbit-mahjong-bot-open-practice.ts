// Doui Lab ranks mahjong bots by mean finishing place after open practice. Its results article lists first-place and fourth-place rates beside each mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://note.com/doui_lab/n/n0eb198d80d28";

const board: Leaderboard = {
  benchmark: "riichi-orbit-mahjong-bot-open-practice",
  url: "https://note.com/doui_lab/n/n0eb198d80d28",
  feed,
  terms: "The maker gives no reuse license in the results post. https://note.com/doui_lab/n/n0eb198d80d28 The feed host publishes robots.txt at https://note.com/robots.txt.",
  async fetch() {
    const article = text(await fetchText(feed));
    const count = article.match(/各モデルの出場数は([\d,]+)半荘/);
    if (!count) throw new Error('Missing match count');
    const trials = Number(count[1].replaceAll(',', ''));
    const pattern = /((?:GPT-|Claude )[A-Za-z0-9. -]+?)：([\d.]+)\s*（1着率([\d.]+)％、4着率([\d.]+)％）/g;
    const rows = [...article.matchAll(pattern)].map(m => ({
      model: m[1].trim(), score: +m[2], trials, setting: m[1].startsWith('Claude') ? '超高' : '極高',
      metrics: { firstPlace: +m[3], fourthPlace: +m[4] },
    }));
    if (rows.length < 6) throw new Error('Incomplete mahjong results');
    return rows;
  },
};
export default board;
