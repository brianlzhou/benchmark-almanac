// OmniLayout ranks PCB placements by electrical functionality against the reference layout. Both tables use inline model and setting arrays.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://www.omnieda.com/";

const board: Leaderboard = {
  benchmark: "omnilayout",
  url: "https://www.omnieda.com/#leaderboard",
  feed,
  terms: "The results page gives no score reuse license. https://www.omnieda.com/ The site allows crawling in robots.txt.",
  async fetch() {
    const html = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [table, columns, expected] of [
      ['T1', 'OO,OoB,RT,P-Pass,HPWL,NC,NS,PRWL,RR,#Vias,R-Pass,Sch.,Ref.,E2E Pass', 45],
      ['T2', 'OO,OoB,RT,HPWL,NC,NS,PRWL,RR,#Vias,Sch.,Ref.,Step', 36],
    ] as const) {
      const names = columns.split(',');
      const source = html.split('const ' + table + ' = [')[1]?.split('\n];')[0] ?? '';
      let count = 0;
      for (const m of source.matchAll(/m:'([^']+)', sz:'([^']+)', type:'(open|closed)', rows:\[([\s\S]*?)\]\}/g)) {
        for (const run of m[4].matchAll(/i:'([^']+)',\s*v:\[([^\]]+)\]/g)) {
          const values: (number | null)[] = JSON.parse('[' + run[2] + ']');
          if (values.length !== names.length) throw new Error('Changed OmniLayout columns');
          count++;
          const score = values[names.indexOf('Ref.')];
          if (score === null) continue;
          const metrics = Object.fromEntries(names.flatMap((k, i) => values[i] === null ? [] : [[k === 'Step' ? 'steps' : k, values[i]!]]));
          rows.push({ model: m[1], setting: run[1], score, metrics, open: m[3] === 'open', params: parseFloat(m[2]) || undefined });
        }
      }
      if (count < expected) throw new Error('Missing OmniLayout settings in ' + table + ': ' + count);
    }
    return rows;
  },
};

export default board;
