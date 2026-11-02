// General365 on general365.github.io. The project page is static HTML with one leaderboard table split into
// "Thinking Models" and "Chat Models" groups: Rank | Models | eight reasoning categories | Overall. Overall
// accuracy (0 to 100) is the score, and the group a row sits under becomes the setting (thinking or
// non-thinking). A group label is either a row of its own or an extra first cell spanning the group's rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://general365.github.io/';

const board: Leaderboard = {
  benchmark: 'general365',
  url: `${URL}#Leaderboard`,
  feed: `${URL} (leaderboard table, Overall)`,
  terms: 'Static GitHub Pages project page with no robots.txt and no terms; the scores are cited to the General365 authors.',
  aliases: {
    'Qwen3-235B-Thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025',
    // V3.2 in its non-thinking (chat) mode
    'DeepSeek-V3.2-Chat': 'deepseek-v3-2',
    'Qwen3-Max-Instruct': 'qwen3-max',
    'LongCat-Flash-Thinking-2509': 'longcat-flash-thinking',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((x) => x[0]?.some((c) => c.text === 'Overall') && x[0]?.some((c) => c.text === 'Models'));
    if (!t) throw new Error('General365 leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Models');
    const iScore = head.indexOf('Overall');
    const rows: LeaderboardRow[] = [];
    let setting: string | undefined;
    const group = (label: string) => (/non-thinking|chat/i.test(label) ? 'non-thinking' : /thinking/i.test(label) ? 'thinking' : undefined);
    for (let r of t.slice(1)) {
      if (r.length === 1) {
        setting = group(r[0].text);
        continue;
      }
      if (r.length === head.length + 1) {
        setting = group(r[0].text);
        r = r.slice(1);
      }
      const score = num(r[iScore]?.text);
      if (!r[iModel]?.text || score === undefined) continue;
      rows.push({ model: r[iModel].text, score, setting });
    }
    if (!rows.length) throw new Error('no rows in the General365 table');
    return rows;
  },
};
export default board;
