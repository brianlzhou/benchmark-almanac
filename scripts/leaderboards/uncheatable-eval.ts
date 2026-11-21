// Uncheatable Eval ranks base models by their average compression ratio on recent documents. Read the default period and complete rendered ranking from the Gradio configuration.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/Jellyfish042/UncheatableEval";
const feed = "https://jellyfish042-uncheatableeval.hf.space/config";

const board: Leaderboard = {
  benchmark: 'uncheatable-eval', url, feed,
  terms: "The Space declares MIT in https://huggingface.co/spaces/Jellyfish042/UncheatableEval/blob/main/README.md. The data URL lists results for the October 2026 test set." ,
  async fetch() {
    const {components} = await fetchJson<{components:{type:string;props:{value?:unknown;label?:string}}[]}>(feed);
    const selected = (label:string) => components.find(c=>c.type === 'dropdown' && c.props.label === label)?.props.value;
    const period = selected('Period');
    if (typeof period !== 'string' || selected('Metric') !== 'Compression Ratio (%)') throw new Error('Unknown default compression view');
    const html = components.find(c=>c.type === 'html' && typeof c.props.value === 'string' && c.props.value.includes('leaderboard-table-scroll'))?.props.value;
    const table = typeof html === 'string' ? tables(html)[0] : undefined;
    const headers = table?.[0].map(c=>c.text);
    const expected = Number(typeof html === 'string' && html.match(/Rank: 1\/(\d+)/)?.[1]);
    if (!table || !headers || headers.slice(0,3).join('|') !== 'Name|Params (B)|Average (lower=better)' || headers.length < 17 ||
        table.length !== expected+1 || expected < 95) throw new Error('Incomplete compression ranking');
    const parts = headers.slice(3);
    board.parts = Object.fromEntries(parts.map(k=>[k,k]));
    return table.slice(1).map(r => {
      if (r.length !== headers.length || !r[0].text || !r.slice(1).every(c=>/^\d+(\.\d+)?$/.test(c.text))) throw new Error('Missing compression score');
      return {model:r[0].text, params:Number(r[1].text), score:Number(r[2].text), setting:period+' · Compression Ratio (%)',
        metrics:Object.fromEntries(parts.map((k,i)=>[k,Number(r[i+3].text)]))};
    });
  },
};
export default board;
