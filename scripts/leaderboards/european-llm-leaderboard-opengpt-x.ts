// The European LLM Leaderboard reports Average across its multilingual accuracy tasks.
// Read the Space’s aggregate-table callbacks for few-shot and zero-shot accuracy with the full model-size range.
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';
import type { LeaderboardRow } from './types.ts';

const url = "https://huggingface.co/spaces/openGPT-X/european-llm-leaderboard";
const feed = "https://eurolingua-european-llm-leaderboard.hf.space";

const board: Leaderboard = {
  benchmark: 'european-llm-leaderboard-opengpt-x', url, feed,
  terms: "The Space lists its license as unknown. https://huggingface.co/spaces/openGPT-X/european-llm-leaderboard/blob/main/README.md" ,
  aliases: {
    "Gemma-1.1-7b-Instruct": "gemma-1-1-7b-it"
  },
  async fetch() {
    const config = await fetchJson<{components:{id:number;type:string;props:{value?:unknown;minimum?:number;maximum?:number}}[];
      dependencies:{api_name:string;inputs:number[];targets:[number|null,string][]}[]}>(feed + '/config');
    const parts: Record<string,string> = {};
    const rows: LeaderboardRow[] = [];
    const pause = () => new Promise(resolve => setTimeout(resolve,1000));
    for (const [endpoint, setting] of [['update_df_17','Few-shot'],['update_df_19','Zero-shot']]) {
      const callback = config.dependencies.find(d => d.api_name === endpoint && d.targets.some(t => t[1] === 'load'));
      if (!callback) throw new Error('Missing accuracy callback ' + endpoint);
      const data = callback.inputs.map(id => {
        const c = config.components.find(v => v.id === id);
        if (!c) throw new Error('Unknown leaderboard control');
        if (c.type === 'rangeslider') return [c.props.minimum,c.props.maximum];
        return c.type === 'textbox' ? '' : c.props.value ?? null;
      });
      const api = feed + '/gradio_api/call/' + endpoint;
      await pause();
      const {event_id} = await fetchJson<{event_id:string}>(api,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data})});
      if (!/^[a-f0-9]+$/.test(event_id)) throw new Error('Missing table event');
      await pause();
      const stream = await fetchText(api+'/'+event_id);
      const payload = stream.match(/event: complete\r?\ndata: (.+)/)?.[1];
      if (!payload) throw new Error('Incomplete accuracy callback');
      const [table] = JSON.parse(payload.replace(/(?<=[,\[])\s*NaN(?=\s*[,\]])/g, 'null')) as {headers:string[];data:(string|number|null)[][]}[];
      const [type,model,average,...tasks] = table.headers;
      if (type !== 'Type' || model !== 'Model_Name' || average !== 'Average' || !['ARC','MMLU','HellaSwag'].every(k=>tasks.includes(k)) || table.data.length < 52) throw new Error('Invalid accuracy table');
      for (const r of table.data) {
        if (r[2] === null) continue;
        if (typeof r[1] !== 'string' || typeof r[2] !== 'number' || r.length !== table.headers.length) throw new Error('Incomplete accuracy row');
        const metrics: Record<string,number> = {};
        tasks.forEach((t,i) => { const v=r[i+3]; if (typeof v === 'number') { parts[t]=t; metrics[t]=100*v; } });
        rows.push({model:text(r[1]), score:100*r[2], link:r[1].match(/href="([^"]+)"/)?.[1], setting, metrics});
      }
    }
    board.parts = parts;
    return rows;
  },
};
export default board;
