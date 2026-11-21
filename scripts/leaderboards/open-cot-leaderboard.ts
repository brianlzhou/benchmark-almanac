// The Open CoT Leaderboard ranks models by average accuracy gain over direct answers.
// Read the full result table in the Gradio configuration, including the five task gains.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/logikon/open_cot_leaderboard";
const feed = "https://logikon-open-cot-leaderboard.hf.space/config";

const board: Leaderboard = {
  benchmark: 'open-cot-leaderboard', url, feed,
  terms: "The Space lists apache-2.0 for its repository. https://huggingface.co/spaces/logikon/open_cot_leaderboard/blob/main/README.md" ,
  aliases: {
    "meta-llama/Llama-2-70b-hf": "llama-2-70b"
  },
  async fetch() {
    type Table = {headers:string[];data:(number|string|null)[][]};
    const {components} = await fetchJson<{components:{type:string;props:{value?:Table}}[]}>(feed);
    const table = components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('Hub License'))?.props.value;
    const splits = ['LogiQA Δ','LogiQA2 Δ','LSAT-ar Δ','LSAT-lr Δ','LSAT-rc Δ'];
    const required = ['model_name_for_query','Average ⬆️','Dashboard','Precision','Hub License','#Params (B)', ...splits];
    if (!table || table.data.length < 133 || required.some(k => !table.headers.includes(k))) throw new Error('Incomplete CoT results');
    board.parts = Object.fromEntries(splits.map(s => [s,s]));
    return table.data.map(row => {
      const value = (k: string) => row[table.headers.indexOf(k)];
      const number = (k:string) => {
        const v = value(k); if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error('Missing ' + k);
        return v;
      };
      const params = value('#Params (B)'), license = value('Hub License');
      return {model:String(value('model_name_for_query')), score:number('Average ⬆️'), setting:String(value('Precision')),
        license:license && license !== '?' ? String(license) : undefined, params:typeof params === 'number' && params > 0 ? params : undefined,
        link:String(value('Dashboard')).match(/href="([^"]+)"/)?.[1], metrics:Object.fromEntries(splits.map(s => [s,number(s)]))};
    });
  },
};
export default board;
