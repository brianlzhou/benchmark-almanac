// LOVEU ranks video editors by average human preference. Its Space reads the competition submissions from result.py and sorts by the human evaluation average.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/loveu-tgve/loveu-tgve-leaderboard/raw/main/result.py";

const board: Leaderboard = {
  benchmark: "loveu-tgve-2023",
  url: "https://huggingface.co/spaces/loveu-tgve/loveu-tgve-leaderboard",
  feed: FEED,
  terms: "The authors license the competition repository under Apache 2.0. The Space lists no separate score license. Five submission rows and two automatic baselines span two source files. https://github.com/showlab/loveu-tgve-2023/blob/main/LICENSE Hugging Face allows crawling.",
  stats: { frameConsistency:{name:'Frame consistency',unit:'score',better:'higher'}, clipTextAlignment:{name:'Contrastive Language Image Pretraining text alignment',unit:'score',better:'higher'}, pickScore:{name:'PickScore',unit:'score',better:'higher'} },
  parts: { quality: 'Quality', structure: 'Structure', text: 'Text Alignment' },
  async fetch() {
    const source = await fetchText(FEED);
    const rows = [...source.matchAll(/"Method"\s*:\s*'\*\*(.*?)\*\*'([\s\S]*?)\n\s*\}/g)].map(([,model,body]) => {
      const values = new Map([...body.matchAll(/"([^"]+) ⬆️"\s*:\s*([\d.]+)/g)].map(m => [m[1],Number(m[2])]));
      const get = (key: string) => { const value = values.get(key); if (value == null || !Number.isFinite(value)) throw new Error('Missing '+key); return value; };
      return { model, score: get('Human Eval (Avg.)'), link: body.match(/href="(https:[^"]+)"/)?.[1], metrics: {
        quality: get('Human Eval (Quality)'), structure: get('Human Eval (Structure)'), text: get('Human Eval (Text Alignment)'),
        frameConsistency: get('CLIPScore (Frame Consistency)'), clipTextAlignment: get('CLIPScore (Text Alignment)'), pickScore: get('PickScore') } };
    });
    if (rows.length < 5) throw new Error('Expected five human-rated entries');
    return rows;
  },
};
export default board;
