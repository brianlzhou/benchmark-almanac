// Published complete-product score on the whole application-building benchmark.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {text} from '../lib/html.ts';
const URL='https://appbench.ai/';
const board:Leaderboard={benchmark:'app-bench',url:URL,feed:URL,
 terms:'Public maker leaderboard; robots.txt permits the root page and no additional reading restrictions are stated.',
 async fetch(){
  const html=await fetchText(URL);const rows=[];
  const models:Record<string,string>={'Claude Code':'Claude Opus 4.5','Google AI Studio':'Gemini 3 Pro Preview','Codex':'gpt-5.1-codex-max','Cursor':'Composer 1','Gemini CLI':'Gemini 2.5 Pro (snapshot unspecified)'};
  // Each ranked bar has an image alt containing the product name and one desktop score-text value.
  for(const m of html.matchAll(/<img[^>]*alt="([^"<>]+) logo"[\s\S]*?class="text-sm score-text[^"<>]*"[^>]*>([\s\S]*?)<\/div>/g)){
   const score=text(m[2]).match(/([\d.]+)\s*%/);if(score)rows.push({model:models[m[1]]??m[1],harness:models[m[1]]?m[1]:undefined,score:Number(score[1]),setting:'best of three builds'});
  }
  if(rows.length<3||new Set(rows.map(r=>r.model)).size!==rows.length)throw new Error('Product bars changed');return rows;
 }};export default board;
