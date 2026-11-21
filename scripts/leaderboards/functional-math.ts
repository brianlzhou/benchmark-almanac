// Functional MATH counts questions solved on both the original problem and every selected monthly variant.
// The authors archive seven snapshot combinations as CSVs alongside the data behind Figure 5.
// Only CSV members are read from the archive.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes, parseCsv } from '../lib/util.ts';
import { execFileSync } from 'node:child_process';

const feed = 'https://raw.githubusercontent.com/ConsequentAI/fneval/main/report/data_files.tar.gz';
const months:Record<string,string> = {oct:'October',nov:'November',dec:'December'};
function percent(value:string) {
  if (!/^\d+(?:\.\d+)?%$/.test(value)) throw new Error('Missing Functional MATH percent: '+value);
  return Number(value.slice(0,-1));
}
const board: Leaderboard = {
  benchmark:'functional-math',url:'https://arxiv.org/abs/2402.19450',feed,
  terms:'The authors publish their report data in their GPL-3.0 repository. GitHub serves the archive on its public raw-file host.',
  async fetch() {
    const archive = Buffer.from(await fetchBytes(feed));
    const read = (filename:string) => parseCsv(execFileSync('tar',['-xzOf','-','data_files/'+filename],{input:archive,encoding:'utf8'}));
    const rows: LeaderboardRow[] = [], parts:Record<string,string> = {};
    for (const suffix of ['','_oct','_nov','_dec','_nov_oct','_dec_oct','_dec_nov']) {
      const file = 'evaluated_models'+suffix+'.json.pickle.stat_csv_static_func.csv';
      const data = read(file);
      if (data.length < 13) throw new Error('Incomplete Functional MATH snapshot '+suffix);
      const setting = (suffix ? suffix.slice(1).split('_').reverse().map(m => months[m]).join(', ') : 'October, November, December')+' 2023';
      for (const r of data) {
        const model = r.Model === 'gpt3' ? 'gpt3 (gpt-3.5-turbo, snapshot unspecified)' : r.Model;
        const metrics:Record<string,number> = { staticAccuracy:percent(r.Static),reasoningGap:percent(r.Gap),
          staticHallucination:percent(r['Static Hall']),functionalHallucination:percent(r['Func Hall']),
          functionalCoverage:percent(r['Fn Coverage']),fractionTested:percent(r['Frac Func Tested']) };
        rows.push({model,score:percent(r.Func),setting,metrics});
      }
    }
    for (const type of ['Subject','Level']) {
      const breakdown = read('evaluated_models.json.pickle.'+type+'.write.csv');
      for (const r of breakdown) {
        const model = r.Model === 'gpt3' ? 'gpt3 (gpt-3.5-turbo, snapshot unspecified)' : r.Model;
        const row = rows.find(x => x.model === model && x.setting === 'October, November, December 2023');
        if (!row || !r[type]) throw new Error('Unexpected Functional MATH breakdown');
        const key = type === 'Level' ? 'Level '+r[type] : r[type];
        parts[key] = key;
        row.metrics![key] = percent(r['W Func']);
      }
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
