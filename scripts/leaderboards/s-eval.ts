// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// S-Eval measures model safety on Chinese and English base prompts. The official board also reports attack success rates.
// Attack success rates have the opposite direction and stay separate from the base safety score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsLiteral } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://s.alibaba.com/aisec/seval';
type Entry = { Model: string, TotalScore: number } & Record<string, string | number>;
const board: Leaderboard = {
  benchmark: 's-eval', url: feed + '/leaderboard', feed,
  aliases: { 'Mistral-Small-3.2-24B-Instruct-2506': 'mistral-small-3-2' },
  terms: 'S-Eval uses CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  headline: 'The board reports each language separately, so this is the plain mean of Chinese and English base risk safety scores.',
  async fetch() {
    const page = await fetchText(feed);
    const asset = page.match(/<script\b[^>]*\bsrc="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!asset) throw Error('Missing S-Eval leaderboard bundle');
    const bundle = (await fetchText(new URL(asset, feed).href)).replace(/:\.(\d+)/g, ':0.$1');
    function group(key: string) {
      const match = new RegExp('\\b' + key + ':[$\\w]+\\(\\[').exec(bundle);
      if (!match) throw Error('Missing S-Eval board: ' + key);
      const entries = jsLiteral<Entry[]>(bundle, match.index + match[0].length - 1);
      const byModel = new Map(entries.map(row => [row.Model, row]));
      if (!entries.length || byModel.size !== entries.length || entries.some(row => !row.Model || !Number.isFinite(row.TotalScore)))
        throw Error('Invalid model rows: ' + key);
      return byModel;
    }
    const zh = group('base_risk_zh'), en = group('base_risk_en');
    const zhAttack = group('attack_zh'), enAttack = group('attack_en');
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const [model, chinese] of zh) {
      const english = en.get(model);
      if (!english) continue;
      const metrics: Record<string, number> = {};
      function record(entry: Entry, label: string, lower: boolean) {
        for (const [name, value] of Object.entries(entry)) {
          if (typeof value !== 'number') continue;
          const key = name === 'TotalScore' ? label : label + ': ' + name;
          parts[key] = { name: key, unit: '%', better: lower ? 'lower' : 'higher' };
          metrics[key] = value;
        }
      }
      record(chinese, 'Chinese', false);
      record(english, 'English', false);
      if (zhAttack.has(model)) record(zhAttack.get(model)!, 'Chinese attack success rate', true);
      if (enAttack.has(model)) record(enAttack.get(model)!, 'English attack success rate', true);
      rows.push({ model, score: (chinese.TotalScore + english.TotalScore) / 2, metrics });
    }
    board.parts = parts;
    return checked(rows, 38);
  },
};
export default board;
