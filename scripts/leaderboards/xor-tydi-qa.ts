// XOR-TyDi QA evaluates cross-lingual retrieval and question answering in seven languages.
// The v1.1 board lists XOR-Retrieve first and ranks by recall at 5,000 tokens.
// Join answer metrics only for identical system names, submitting institutions and API tracks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://nlp.cs.washington.edu/xorqa/';
const tasks = [
  {name:'XOR-Retrieve', keys:['R@5kt','R@2kt']},
  {name:'XOR-English Span', keys:['F1','EM']},
  {name:'XOR-Full', keys:['F1','EM','BLEU']},
];
const parts = Object.fromEntries(tasks.flatMap(t=>t.keys.map(k=>[t.name+k,t.name+': '+k])));
const board: Leaderboard = {
  benchmark: 'xor-tydi-qa', url: feed, feed, parts,
  terms: 'CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  headline: 'The headline is XOR-Retrieve recall at 5,000 tokens, averaged over seven languages.',
  async fetch() {
    const html = await fetchText(feed);
    const results = new Map<string,LeaderboardRow>();
    for (const [index,task] of tasks.entries()) {
      const section = html.split('<h2>Task '+(index+1)+': '+task.name)[1]?.split('<h2>')[0];
      if (!section?.includes('Systems using external APIs')) throw new Error('Missing API tracks for '+task.name);
      const tracks = tables(section);
      if (tracks.length !== 2) throw new Error('Expected two tracks');
      for (const [track,table] of tracks.entries()) {
        if (table[0].map(c=>c.text).join('|') !== ['Rank','Model',...task.keys].join('|')) throw new Error('Missing '+task.name+' columns');
        for (const [rank,system,...cells] of table.slice(1)) {
          const [label,institution] = system.html.split(/<p\s+class="institution">/i);
          if (!institution || cells.length !== task.keys.length) throw new Error('Incomplete row');
          const model = text(label), submitter = text(institution);
          const key = JSON.stringify([model,submitter,track]);
          let row = results.get(key);
          if (!row && index !== 0) continue;
          const values = cells.map(c=>Number(c.text));
          if (cells.some(c=>!c.text) || !values.every(Number.isFinite)) throw new Error('Missing scores');
          if (!row) {
            const stamp = rank.text.replace(/^\d+\s+/,'');
            row = {model, submitter, setting: track ? 'External APIs' : 'White-box', date: new Date(stamp+' UTC').toISOString().slice(0,10), score: values[0], metrics: {}};
            results.set(key,row);
          }
          task.keys.forEach((k,i) => { row.metrics![task.name+k] = values[i]; });
        }
      }
    }
    return checked([...results.values()],16);
  },
};
export default board;
