// PatentQA tests answers to questions about patent documents. Edison publishes mean scores by model, variant and input mode.
// The subtask page also reports mean output tokens, duration and evaluation date.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://advances.edisonscientific.com/benchmarks/labbench2/patentqa/";


const board: Leaderboard = {
  benchmark: "labbench2-patentqa",
  url: "https://advances.edisonscientific.com/benchmarks/labbench2/patentqa/",
  feed,
  terms: "The public benchmark page gives no separate score license. Its robots.txt URL serves HTML.",
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t=>t[0]?.map(c=>c.text.replace(/[↕↓↑]/g,'').trim()).join('|') === '#|Model|Variant|Mode|Average score|Average output tokens|Avg. dur|Date');
    if (!t || t.length < 11) throw new Error('Missing PatentQA configurations or columns');
    return t.slice(1).map(r=>{
      const [,model,variant,mode,score,tokens,duration,date] = r.map(c=>c.text);
      const tok = /^([\d.]+)(k|M)?$/.exec(tokens), time = /^([\d.]+)(s|m|h)$/.exec(duration);
      if (!model || !score || !Number.isFinite(Number(score))) throw new Error('Invalid PatentQA score');
      return {model, setting:[mode,variant].filter(s=>s && s!=='—').join(' / '), score:100*Number(score), date,
        tokens:tok ? Number(tok[1])*(tok[2]==='k'?1000:tok[2]==='M'?1e6:1) : undefined,
        metrics:time ? {latency:Number(time[1])*(time[2]==='m'?60:time[2]==='h'?3600:1)} : undefined };
    });
  },
};
export default board;
