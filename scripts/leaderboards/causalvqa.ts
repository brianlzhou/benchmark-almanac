// CausalVQA baseline percentages embedded in the official public Space source. Read literal baseline fields without executing Python; exclude human and dummy data.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/facebook/pwm_leaderboard/resolve/main/app.py";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "causalvqa",
  url: "https://huggingface.co/spaces/facebook/pwm_leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const source=await fetchText(FEED);const out:LeaderboardRow[]=[];
    for(const m of source.matchAll(/^([A-Z][A-Z0-9_]*)\s*=\s*\{([\s\S]*?)^\}/gm)){
      if(m[1]==='HUMAN_BASELINES')continue;const score=m[2].match(/f"score_\{WMQA_KEY\}":\s*([\d.]+)/)?.[1];const name=m[2].match(/"model":\s*"([^"]+)"/)?.[1];if(!score||!name)continue;
      const backbone=m[2].match(/"llm_backbone":\s*"([^"]+)"/)?.[1];const vision=m[2].match(/"vision_backbone":\s*"([^"]+)"/)?.[1];const frames=Number(m[2].match(/"num_frames":\s*(-?\d+)/)?.[1]);
      const model=name==='InternVL2.5'?'InternVL2.5-8B':name==='Qwen2.5-VL'?'Qwen2.5-VL-7B-Instruct':name==='LLaVA-OneVision'?'llava-onevision-qwen2-7b-ov':name;
      out.push({model:identity(model),score:Number(score),setting:`Published baseline; vision ${vision}; LLM ${backbone}`,date:m[2].match(/"date":\s*"([^"]+)"/)?.[1],metrics:frames>=0?{frames}:{}});
    }if(!out.length)throw new Error('CausalVQA baseline literals missing');return out;
  },
};
export default board;
