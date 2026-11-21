// Cornell’s archived NLVR2 leaderboard ranks systems by accuracy on Test-U.
// Read the NLVR2 HTML table, including consistency, public-test accuracy, development accuracy and submission details.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const url = "https://lil.nlp.cornell.edu/nlvr/";
const feed = "https://lil.nlp.cornell.edu/nlvr/";

const board: Leaderboard = {
  benchmark: 'nlvr2', url, feed,
  terms: "The lab publishes a static results table. The page does not specify reuse terms for the scores. https://lil.nlp.cornell.edu/nlvr/" ,
  parts: {dev:'Dev. (Acc)', publicTest:'Test-P (Acc)'},
  stats: { consistency: { name: 'Test-U consistency', unit: '%', better: 'higher' } },
  async fetch() {
    const html = await fetchText(feed);
    const section = html.split('<h2>NLVR2 Leaderboard</h2>')[1]?.split('<h2>')[0];
    const [table] = tables(section ?? '');
    const headers = ['Rank','Model','Dev. (Acc)','Test-P (Acc)','Test-U (Acc)','Test-U (Cons)'];
    if (!table || table[0].map(c=>c.text).join('|') !== headers.join('|')) throw new Error('Missing NLVR2 table');
    const rows = table.slice(1).filter(r => !r[1]?.text.startsWith('Human Performance'));
    if (rows.length < 11) throw new Error('Incomplete NLVR2 ranking');
    return rows.map((r,i) => {
      const date = r[0].html.match(/class="date [^"]+">([^<]+)/)?.[1];
      const submitter = r[1].html.match(/<p class="institution">([\s\S]*?)<\/p>/)?.[1];
      const model = text(r[1].html.split('<p')[0]);
      if (!date || !model || !submitter || Number.parseInt(r[0].text) !== i+1 || r.length !== 6 ||
          !r.slice(2).every(c=>/^\d+(\.\d+)?$/.test(c.text))) throw new Error('Invalid NLVR2 entry');
      return { model, submitter:text(submitter), date:new Date(date+' UTC').toISOString().slice(0,10), link:r[1].html.match(/href="([^"]+)"/)?.[1],
        score:Number(r[4].text), metrics:{dev:Number(r[2].text), publicTest:Number(r[3].text), consistency:Number(r[5].text)} };
    });
  },
};
export default board;
