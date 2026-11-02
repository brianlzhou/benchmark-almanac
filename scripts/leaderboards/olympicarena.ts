// OlympicArena (GAIR) on gair-nlp.github.io/OlympicArena. The page holds two static HTML tables behind a
// toggle: the validation set (shown first) and the test set (id="table2"), which the paper and the page's
// medal table use. The test set is read here: Model | Setting (LLM or LMM) | Date | Overall | seven
// subjects and splits. Overall accuracy (0 to 100) is the score and Date (YYYY-M-D, when the row was
// added) the row date, so the resolver picks the snapshot current then.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { readTable } from './visulogic.ts';

const URL = 'https://gair-nlp.github.io/OlympicArena/';

const board: Leaderboard = {
  benchmark: 'olympicarena',
  url: URL,
  feed: `${URL} (test set table, id="table2")`,
  terms: 'Static GitHub Pages project page with no robots.txt; the site content is CC BY-SA 4.0 (page footer) and the scores are cited to GAIR.',
  aliases: {
    'Llama-3-70B-Instruct': 'llama-3-70b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
    'Gemma2-27B-it': 'gemma-2-27b',
    'Gemini Pro Vision': 'gemini-1-0-pro-vision',
    'Qwen1.5-32B-Chat': 'qwen1-5-32b',
    'Yi-34B-Chat': 'yi-34b',
    'Qwen-7B-Chat': 'qwen-7b',
  },
  async fetch() {
    const html = await fetchText(URL);
    const at = html.indexOf('<table id="table2"');
    if (at < 0) throw new Error('OlympicArena test set table not found');
    const rows: LeaderboardRow[] = readTable(html.slice(at), { model: /^Model$/i, score: /^Overall$/i });
    // the Date cells read "2024-6-12", which readTable does not parse, so they are padded here
    const dates = [...html.slice(at, html.indexOf('</table>', at)).matchAll(/<td>\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*<\/td>/g)];
    if (dates.length === rows.length) {
      rows.forEach((r, i) => (r.date = `${dates[i][1]}-${dates[i][2].padStart(2, '0')}-${dates[i][3].padStart(2, '0')}`));
    }
    return rows;
  },
};
export default board;
