// CodeClash on codeclash.ai. The page is static HTML with one leaderboard table: Rank | Model | ELO, where
// ELO (the board's unit, shown "1385 ± 18") is the rating from head-to-head code tournaments. The reader
// lives in visulogic.ts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const URL = 'https://codeclash.ai/';

const board: Leaderboard = {
  benchmark: 'codeclash',
  url: URL,
  feed: `${URL} (leaderboard table)`,
  terms: 'Static public page; the site has no robots.txt and no terms, and the CodeClash code is public on GitHub.',
  aliases: {
    'Grok Code Fast': 'grok-code-fast-1',
  },
  async fetch() {
    const table=tables(await fetchText(URL)).find(t=>t[0]?.some(c=>c.text==='ELO'));
    if(!table)throw new Error('CodeClash Elo table missing');
    const header=table[0].map(c=>c.text);
    const rows=table.slice(1).flatMap(r=>{
      const model=r[header.indexOf('Model')]?.text;
      const value=r[header.indexOf('ELO')]?.text.match(/^([\d.]+)\s*±\s*([\d.]+)/);
      if(!model||!value)return [];
      const score=Number(value[1]),margin=Number(value[2]);
      return [{model,score,metrics:{ratingMargin:margin}}];
    });
    if(!rows.length)throw new Error('CodeClash ratings missing');
    return rows;
  },
};
export default board;
