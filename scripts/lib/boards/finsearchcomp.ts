// FinSearchComp's project page gives a separate headline Avg. (%) for Global and Greater China.
// Preserve the published average and keep the three task scores as metrics. Web products do not
// identify dated API snapshots, so retain their source names without model aliases.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { tables, num } from '../html.ts';

const FEED = 'https://randomtutu.github.io/FinSearchComp/';
export function finsearchcompBoard(track: 'global' | 'greater-china'): Leaderboard {
  const heading = track === 'global' ? 'Global Data Performance' : 'Greater China Data Performance';
  return {
    benchmark: `finsearchcomp-${track}`, url: FEED, feed: FEED,
    terms: 'The authors publish these tables on their project page; retain attribution and follow the source terms.',
    async fetch() {
      const source = await fetchText(FEED);
      const section = source.match(new RegExp(heading + '</h3>([\\s\\S]*?)</table>'))?.[1];
      const t = section ? tables(section + '</table>')[0] : undefined;
      if (!t || !t[0].some(c => c.text === 'Avg.')) throw new Error(`FinSearchComp ${heading}: average table missing`);
      const head = t[0].map(c => c.text), modelCol = head.indexOf('Model'), scoreCol = head.indexOf('Avg.');
      if (modelCol < 0) throw new Error('FinSearchComp model column missing');
      const rows: LeaderboardRow[] = [];
      for (const r of t.slice(1)) {
        const model = r[modelCol]?.text.replace(/[🥇🥈🥉]/gu, '').trim(), score = num(r[scoreCol]?.text);
        if (!model || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (const [label, key] of [['Time-Sensitive', 'timeSensitive'], ['Simple Historical', 'simpleHistorical'], ['Complex Historical', 'complexHistorical']]) {
          const value = num(r[head.indexOf(label)]?.text); if (value !== undefined) metrics[key] = value;
        }
        rows.push({ model, score, harness: 'web product', metrics });
      }
      if (!rows.length) throw new Error(`FinSearchComp ${track}: no average rows`);
      return rows;
    },
  };
}
