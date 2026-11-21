// Harvest Rush Training Evaluation tests priced driving decisions in a farm game.
// The README's held-out table reports mean reward for six named model recipes.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://raw.githubusercontent.com/CompassionML/harvest-rush-train/main/README.md';
export default {benchmark:'harvest-rush-train',url:'https://github.com/CompassionML/harvest-rush-train',feed,terms:'MIT License. https://github.com/CompassionML/harvest-rush-train/blob/main/LICENSE',aliases:{'Qwen2.5-1.5B-Instruct':'qwen2-5-1-5b'},async fetch(){
 const t=await fetchText(feed); if(!t.includes('Measured with LoRA on 300 held-out examples')) throw new Error('Results table missing');
 return checked([
  {model:'Qwen2.5-1.5B-Instruct',setting:'untrained',score:.55},
  {model:'Qwen2.5-1.5B-Instruct',setting:'GRPO from scratch, control_consistent',score:.63},
  {model:'Qwen2.5-1.5B-Instruct',setting:'GRPO from scratch, harm_averse, unscaled',score:.56},
  {model:'Qwen2.5-1.5B-Instruct',setting:'SFT on the answer column, 2,000 examples',score:.98},
  {model:'Llama 3.1 8B',setting:'untrained',score:.61},
  {model:'Llama 3.1 8B',setting:'GRPO from scratch, 300 steps',score:.81},
 ],6);
}} satisfies Leaderboard;
