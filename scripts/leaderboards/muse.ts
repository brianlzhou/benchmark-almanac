// The source reports no overall score column. The headline is the plain mean of the 12 parts, computed by this importer.
// MUSE tests artistic image understanding in education. Table 2 orders models by average performance
// and gives twelve percentage scores. Table 3 identifies the open-weight checkpoints.
import type { BoardPart, Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2609.19088';
const names = ['Object Classification','Object Count','Activity Localization','Activity Description','Scene Classification',
  'Emotion Detection','Visual Clue Identification','Emotion Cause Inference','Relative Position','Remote Interaction','Jigsaw Puzzle','Cultural Identification'];
const board: Leaderboard = {
  benchmark:'muse', static:'paper', url, feed:url, terms:PAPER_TERMS,
  headline:'Table 2 ranks models by average performance. The headline is the mean of its twelve task scores.',
  aliases:{'Qwen3-VL-8b':'qwen3-vl-8b-instruct','Qwen3-VL-32b':'qwen3-vl-32b-instruct','CogVLM2-19b':'cogvlm2-llama3-chat-19b',
    'LLaVA-Next-8b':'llama3-llava-next-8b','LLaVA-Next-34b':'llava-v1-6-34b','Gemma3-12b-it':'gemma-3-12b','Gemma3-27b-it':'gemma-3-27b','Gemma3-4b-it':'gemma-3-4b'},
  async fetch() {
    const t = flatPaperTables(await paperHtml(url)).map(grid).find(t => t[1]?.join('|') === 'Model|Object Cls.|Object Count|Activity Loc.|Activity Desc.|Scene Cls.|Emotion Det.|Visual Clue Ident.|Emotion Cause Infer.|Relative Position|Remote Interaction|Jigsaw Puzzle|Cultural Ident.');
    if (!t) throw new Error('Missing MUSE artist education Table 2');
    const parts: Record<string,BoardPart> = {};
    names.forEach((name,i) => parts[name] = {name,group:t[0][i+1],unit:'%'});
    board.parts = parts;
    return checked(t.slice(2).map(([model,...cells]) => {
      if (cells.length !== names.length) throw new Error('Missing MUSE task for '+model);
      const scores = cells.map(numberCell);
      return {model,score:scores.reduce((a,b) => a+b,0)/scores.length,metrics:Object.fromEntries(names.map((name,i) => [name,scores[i]]))};
    }),30);
  },
};
export default board;
