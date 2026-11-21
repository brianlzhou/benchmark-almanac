// Five-shot direct accuracy, with domain, subject and KMMLU-KOR subset scores and model size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2402.11548';
const board: Leaderboard = {
  benchmark:'kmmlu', static: 'paper', parts: {
  appliedScience: { name: 'Applied science', group: 'Domain' },
  other: { name: 'Other', group: 'Domain' },
  stem: { name: 'STEM', group: 'Domain' },
  humss: { name: 'Humanities and social science', group: 'Domain' },
},url:'https://arxiv.org/abs/2402.11548',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Model|STEM|Applied Science|HUMSS|Other|Average');
    if(!t)throw new Error('KMMLU full test table missing');
    const subjects = new Map<string, Record<string, number>>();
    const canonical = (name: string) => name === 'HCX.' ? 'hyperclova x' : name.toLowerCase();
    function put(name: string, key: string, label: string, group: string, value: string) {
      if (!/^\d+(?:\.\d+)?$/.test(value)) return;
      const id = canonical(name);
      const scores = subjects.get(id) ?? {};
      scores[key] = Number(value);
      subjects.set(id, scores);
      board.parts![key] = { name: label, group };
    }
    for (const table of ts.filter(t => t[0][0] === 'Category' && t.some(r => r[0] === 'accounting'))) {
      // The last subject table evaluates CoT on KMMLU-Hard.
      if (table[0][1] === 'Qwen-72B-Chat') continue;
      const subhead = table[1][0] === '' ? table[1] : undefined;
      for (const r of table.slice(subhead ? 2 : 1)) {
        const label = r[0];
        const key = label.toLowerCase().replace(/[-_ ]+(.)/g, (_, c: string) => c.toUpperCase());
        for (let i=1; i<r.length; i++) {
          const sub = subhead?.[i];
          const suffix = sub === 'Chat' ? '-Chat' : sub?.endsWith('B') ? '-' + sub : '';
          put(table[0][i] + suffix, key, label.replaceAll('_',' '), 'Subject', r[i]);
        }
      }
    }
    const kor = ts.find(t => t[0][1] === 'Cultural');
    for (const r of kor?.slice(1) ?? []) {
      for (let i=1; i<r.length; i++) put(r[0], 'kor' + kor![0][i], kor![0][i], 'KMMLU-KOR', r[i]);
    }
    const rows=t.slice(1).filter(r=>/^\d+(?:\.\d+)?$/.test(r[5])).map(r=>({model:uncertain(r[0].endsWith("-Chat") ? r[0]+" (chat weights)" : r[0]),score:Number(r[5]),params:num(r[0].match(/([\d.]+)B/)?.[1]),open:/[\d.]B/i.test(r[0]) ? true : /^(GPT|Gemini-Pro|HyperCLOVA)/.test(r[0]) ? false : undefined,setting:'5-shot; Direct',metrics:{...subjects.get(canonical(r[0])),stem:Number(r[1]),appliedScience:Number(r[2]),humss:Number(r[3]),other:Number(r[4])}}));
    return checked(rows,3);
  },
};
export default board;
