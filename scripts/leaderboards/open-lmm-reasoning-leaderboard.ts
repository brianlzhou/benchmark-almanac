// OpenCompass averages six multimodal reasoning evaluations, using the strict score for WeMath. The Space’s rendered dataframe supplies the rounded overall and component scores.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://opencompass-open-lmm-reasoning-leaderboard.hf.space/config";
interface Frame { type:string; props:{value?:{headers:string[];data:(string|number|null)[][]}} }

const board: Leaderboard = {
  benchmark: "open-lmm-reasoning-leaderboard",
  url: "https://huggingface.co/spaces/opencompass/Open_LMM_Reasoning_Leaderboard",
  feed: FEED,
  terms: "The Space publishes its loader at https://huggingface.co/spaces/opencompass/Open_LMM_Reasoning_Leaderboard/tree/main. Results licensing requires separate verification. Hugging Face allows crawling.",
  async fetch() {
    const { components } = await fetchJson<{components:Frame[]}>(FEED);
    const table = components.find(c => c.type === 'dataframe' && c.props.value?.headers.includes('LogicVista') && c.props.value.headers.includes('MathVista'))?.props.value;
    if (!table || table.headers[6] !== 'Overall' || table.headers.length !== 13) throw new Error('Changed reasoning table');
    const parts = table.headers.slice(7);
    board.parts = Object.fromEntries(parts.map(p => [p,p]));
    const rows = table.data.flatMap(r => {
      if (r[6] == null || r[6] === '') return [];
      const score = r[6], label = String(r[1]), model = text(label);
      if (!model || typeof score !== 'number' || !r.slice(7).every(v => typeof v === 'number')) throw new Error('Incomplete OpenCompass result');
      return [{ model, score, params: typeof r[3] === 'number' ? r[3] : undefined, link: label.match(/href="(https?:[^"]+)"/)?.[1],
        metrics: Object.fromEntries(parts.map((p,i) => [p,Number(r[i+7])])) }];
    });
    if (rows.length < 83) throw new Error('Expected 83 overall scores');
    return rows;
  },
};
export default board;
