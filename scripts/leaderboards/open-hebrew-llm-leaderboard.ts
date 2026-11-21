// The Hebrew LLM Leaderboard ranks configurations by the published six-task average. The Space config contains the visible scores and their underlying evaluation metadata.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://hebrew-llm-leaderboard-leaderboard.hf.space/config";
type Cell = string | number | boolean | null;
interface Component { type:string; props:{ visible:boolean; value?:{headers:string[];data:Cell[][]} } }

const board: Leaderboard = {
  benchmark: "open-hebrew-llm-leaderboard",
  url: "https://huggingface.co/spaces/hebrew-llm-leaderboard/leaderboard",
  feed: FEED,
  terms: "The Space declares Apache 2.0 for its code. The public table supplies scores without a separate results license. https://huggingface.co/spaces/hebrew-llm-leaderboard/leaderboard Hugging Face allows crawling.",
  async fetch() {
    const { components } = await fetchJson<{components:Component[]}>(FEED);
    const frames = components.filter(c => c.type === 'dataframe' && c.props.value?.headers.includes('Average ⬆️'));
    const visible = frames.find(c => c.props.visible)?.props.value;
    const full = frames.find(c => c.props.value?.headers.includes('Precision'))?.props.value;
    if (!visible || !full || visible.data.length < 203) throw new Error('Missing Hebrew standings');
    const tasks = visible.headers.slice(3,9);
    if (tasks.length !== 6 || tasks[0] !== 'SNLI Accuracy' || tasks[5] !== 'Israeli Trivia') throw new Error('Changed Hebrew task columns');
    board.parts = Object.fromEntries(tasks.map(k => [k,k]));
    return visible.data.map(r => {
      const model = String(r.at(-1)), score = r[2];
      const d = full.data.find(v => v.at(-1) === model && v[2] === score);
      if (!d || typeof score !== 'number' || !model) throw new Error('Missing Hebrew configuration metadata');
      const metrics: Record<string,number> = {};
      for (const [i,k] of tasks.entries()) { const value = r[i+3]; if (typeof value === 'number') metrics[k] = value; }
      const param = d[full.headers.indexOf('#Params (B)')];
      return { model, score, setting: String(d[full.headers.indexOf('Precision')]), license: String(d[full.headers.indexOf('Hub License')]),
        params: typeof param === 'number' ? param : undefined, link: String(r[1]).match(/href="(https:[^"]+)"/)?.[1], metrics };
    });
  },
};
export default board;
