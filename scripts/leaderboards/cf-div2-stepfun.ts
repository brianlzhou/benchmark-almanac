// Catalog alias CF-Div2-Stepfun-cpp denotes the C++ avg@8 board. Python and Java
// use double time limits and remain secondary metrics, not interchangeable headline rows.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';
const PAGE='https://huggingface.co/datasets/stepfun-ai/CF-Div2-Stepfun';
const board:Leaderboard={benchmark:'cf-div2-stepfun',url:PAGE,feed:PAGE+'/raw/main/README.md',
 terms:'CC-BY-4.0 benchmark data and public author results. The Almanac credits StepFun and links the source.',
 async fetch(){
 const t=markdownTables(await fetchText(PAGE+'/raw/main/README.md')).find(t=>t[0]?.some(h=>h.includes('C++ (avg@8)')));
 if(!t)throw new Error('CF-Div2 result table missing');
 return t.slice(1).flatMap(r=>{const score=num(r[1]);return score===undefined?[]:[{model:r[0],score,setting:'C++; avg@8',metrics:{python:num(r[2])!,java:num(r[3])!,cppPass8Rating:num(r[4])!}}];});
 }};export default board;
