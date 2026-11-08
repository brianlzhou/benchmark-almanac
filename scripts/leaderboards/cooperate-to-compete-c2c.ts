// C2C: the page's Overall Player Strength chart publishes signed Plackett-Luce strengths as HTML text.
// Keep the Human row as an unlisted reference. Reasoning and non-reasoning Grok runs are separate settings.
// The chart's adjacent source comments spell out the abbreviated Grok and Gemini model names.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text, num } from '../lib/html.ts';

const PAGE = 'https://negotiationgame.io/c2c/';
const board: Leaderboard = {
  benchmark: 'cooperate-to-compete-c2c', url: PAGE, feed: PAGE,
  terms: 'The authors publish this public HTML results chart, with attribution retained and no separate score reuse license stated.',
  aliases: { 'Gemini Flash Lite': 'gemini-3-1-flash-lite' },
  async fetch() {
    const html = await fetchText(PAGE);
    const start = html.indexOf('<h4>Overall Player Strength</h4>');
    if (start < 0) throw new Error('C2C strength chart missing');
    const section = html.slice(start).split('</section>')[0];
    const rows: LeaderboardRow[] = [];
    for (const part of section.split('<div class="pl-row">').slice(1)) {
      const label = part.match(/<div class="pl-label">([\s\S]*?)<\/div>/)?.[1];
      const value = part.match(/<div class="pl-val"[^>]*>([\s\S]*?)<\/div>/)?.[1];
      const score = num(value?.replace(/&minus;|−/g, '-'));
      if (!label || score === undefined) continue;
      let model = text(label);
      let setting: string | undefined;
      if (/^Grok 4\.1 \((?:reason\.|no reas\.)\)$/.test(model)) {
        setting = model.includes('no reas.') ? 'non-reasoning' : 'reasoning';
        model = 'Grok 4.1 Fast';
      }
      rows.push({ model, setting, score });
    }
    if (!rows.length) throw new Error('C2C strength rows missing');
    return rows;
  },
};
export default board;
