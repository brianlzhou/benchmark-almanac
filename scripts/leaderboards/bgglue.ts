// bgGLUE ranks Bulgarian language models by the average score across nine tasks. Read the authors’ HTML table, including the submitting team and task scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const url = "https://bgglue.github.io/leaderboard";
const feed = "https://bgglue.github.io/leaderboard/";

const board: Leaderboard = {
  benchmark: 'bgglue', url, feed,
  terms: "The project website specifies CC BY-NC-ND 4.0. https://bgglue.github.io/" ,
  async fetch() {
    const table = tables(await fetchText(feed)).find(t=>t[0]?.[4]?.text === 'Score');
    const keys = ['BSNLP','Cinexio','CT21.T1','Cred.-N','EXAMS','Fake-N','U.Dep','PAN-X','XNLI'];
    const columns = ['#','Team','Model','URL','Score',...keys];
    if (!table || table.length < 9 || columns.some((k,i)=>table[0][i]?.text !== k)) throw new Error('Incomplete bgGLUE table');
    board.parts = Object.fromEntries(keys.map(k => [k,k]));
    return table.slice(1).map(r => {
      if (r.length !== columns.length || !r[2].text || !r.slice(4).every(c=>/^\d+(\.\d+)?$/.test(c.text))) throw new Error('Invalid bgGLUE row');
      return {model:r[2].text, submitter:r[1].text, score:Number(r[4].text), link:r[3].html.match(/href="(https?:[^"]+)"/)?.[1],
        metrics:Object.fromEntries(keys.map((k,i)=>[k,Number(r[i+5].text)]))};
    });
  },
};
export default board;
