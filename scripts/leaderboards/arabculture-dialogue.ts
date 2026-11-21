// ArabCulture-Dialogue tests cultural understanding in parallel Arabic dialogues and evaluates translation and dialect steering.
// Table 2 gives Task 1 accuracy. MSA and dialect each have 3,471 dialogues, so their equal-weight mean covers all 6,942.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.00119';
const keys = ['MSA','MSA CS','MSA ~CS','Dialect','Dialect CS','Dialect ~CS'];
export default {
  benchmark: 'arabculture-dialogue', url: feed, feed, static: 'paper',
  terms: 'The paper and license are at https://arxiv.org/abs/2605.00119',
  headline: 'The headline is Task 1 multiple-choice accuracy averaged over the equally sized MSA and dialect sets. The paper scores translation and dialect steering separately.',
  parts: Object.fromEntries(keys.map(k => [k,k])),
  stats: {
    'MSA to Dialect: ALDi':{name:'MSA to dialect ALDi',unit:'score',better:'higher'},'MSA to Dialect: BLEU':{name:'MSA to dialect BLEU',unit:'score',better:'higher'},'MSA to Dialect: BERTScore':{name:'MSA to dialect BERTScore',unit:'score',better:'higher'},'MSA to Dialect: Adequacy':{name:'MSA to dialect adequacy',unit:'score',better:'higher'},'MSA to Dialect: Fluency':{name:'MSA to dialect fluency',unit:'score',better:'higher'},'MSA to Dialect: Register':{name:'MSA to dialect register',unit:'score',better:'higher'},'MSA to Dialect: Terminology':{name:'MSA to dialect terminology',unit:'score',better:'higher'},'MSA to Dialect: Overall':{name:'MSA to dialect overall rating',unit:'score',better:'higher'},
    'Dialect to MSA: ALDi':{name:'Dialect to MSA ALDi',unit:'score',better:'higher'},'Dialect to MSA: BLEU':{name:'Dialect to MSA BLEU',unit:'score',better:'higher'},'Dialect to MSA: BERTScore':{name:'Dialect to MSA BERTScore',unit:'score',better:'higher'},'Dialect to MSA: Adequacy':{name:'Dialect to MSA adequacy',unit:'score',better:'higher'},'Dialect to MSA: Fluency':{name:'Dialect to MSA fluency',unit:'score',better:'higher'},'Dialect to MSA: Register':{name:'Dialect to MSA register',unit:'score',better:'higher'},'Dialect to MSA: Terminology':{name:'Dialect to MSA terminology',unit:'score',better:'higher'},'Dialect to MSA: Overall':{name:'Dialect to MSA overall rating',unit:'score',better:'higher'},
    'Steering: MSA judge':{name:'MSA steering judge score',unit:'score',better:'higher'},'Steering: MSA dialect accuracy':{name:'MSA dialect accuracy',unit:'score',better:'higher'},'Steering: Dialect judge':{name:'Dialect steering judge score',unit:'score',better:'higher'},'Steering: Dialect accuracy':{name:'Dialect accuracy',unit:'score',better:'higher'},
  },
  async fetch() {
    const ts = paperTables(await paperHtml(feed)).map(grid);
    const table = ts.find(t => t[0]?.includes('Context: None') && t[0]?.includes('Context: Region + Country') && t[2]?.[1] === 'Acc');
    if (!table) throw new Error('Missing Task 1 accuracy table');
    const translation = ts.filter(t => t[0]?.[1] === 'ALDi (0–1)' && t[1]?.at(-1) === 'Overall');
    if (translation.length !== 2) throw new Error('Missing Table 3 translation directions');
    const steering = ts.find(t => t[0]?.includes('Target: MSA') && t[0]?.includes('Target: Dialect'));
    if (!steering) throw new Error('Missing Table 4 dialect steering results');
    const zeroShot = steering.slice(2,steering.findIndex(r => r[0].includes('(SFT)')));
    const rows: LeaderboardRow[] = [];
    for (const c of table.slice(3)) {
      if (c[0] === 'Random' || c[0] === c[1]) continue;
      for (const offset of [1,7]) {
        const metrics = Object.fromEntries(keys.map((key,i) => [key,100*numberCell(c[offset+i])]));
        if (offset === 7) for (const [i,t] of translation.entries()) {
          const row = t.slice(2,t.findIndex(r => r[0].includes('(SFT)'))).find(r => r[0] === c[0]);
          if (!row) continue;
          const dir = i === 0 ? 'MSA to Dialect' : 'Dialect to MSA';
          for (const [j,k] of ['ALDi','BLEU','BERTScore','Adequacy','Fluency','Register','Terminology','Overall'].entries()) {
            const val = row[j+1].match(/^(\d+\.\d+)(?:\s|$)/);
            if (val) metrics[dir + ': ' + k] = Number(val[1]);
          }
        }
        if (offset === 7) {
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
          const r = zeroShot.find(r => norm(r[0]) === norm(c[0]));
          if (r) for (const [j,k] of ['MSA judge','MSA dialect accuracy','Dialect judge','Dialect accuracy'].entries()) {
            metrics['Steering: ' + k] = numberCell(r[j+1]);
          }
        }
        rows.push({ model: c[0], setting: table[0][offset], score: (metrics.MSA+metrics.Dialect)/2, metrics });
      }
    }
    return checked(rows,24);
  },
} satisfies Leaderboard;
