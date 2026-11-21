// Doui Lab compares finished mahjong bots by mean placement in four-player matches.
// The September 23 results post reports two distinct tables and first- and fourth-place rates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://note.com/doui_lab/n/n4e733f1f6be9";

const board: Leaderboard = {
  benchmark: "riichi-orbit-mahjong-bot-two-stage",
  url: "https://note.com/doui_lab/n/n4e733f1f6be9",
  feed,
  terms: "The maker gives no reuse license in the results post. robots.txt allows the feed path.",
  async fetch() {
    const page = text(await fetchText(feed));
    const rounds = page.match(/第1戦：([\s\S]+?)第2戦：([\s\S]+?)まとめ/);
    if (!rounds || !page.includes('1,536半荘')) throw new Error('Missing match results');
    return rounds.slice(1).flatMap((round, i) => {
      const matches = [...round.matchAll(/(GPT-[\d.]+ \w+)：\s*([\d.]+)\s*（1着率([\d.]+)%、4着率([\d.]+)%）/g)];
      if (matches.length !== 4) throw new Error('Expected four bots per table');
      return matches.map(([, model, score, first, fourth]) => ({ model, score: Number(score), setting: 'Table ' + (i + 1),
        trials: 1536, date: '2026-09-23', metrics: { firstPlaceRate: Number(first), fourthPlaceRate: Number(fourth) } }));
    });
  },
};
export default board;
