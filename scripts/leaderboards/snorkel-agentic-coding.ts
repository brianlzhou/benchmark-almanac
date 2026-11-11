// Original Agentic Coding uses Pass@5. The 2.0 board is a separate benchmark.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';import {tables,num} from '../lib/html.ts';
const url='https://snorkel.ai/leaderboard/agentic-coding/';
const board:Leaderboard={benchmark:'snorkel-agentic-coding',url,feed:url,
terms:'Snorkel terms prohibit automated extraction and republication. The almanac credits Snorkel AI and links the source.',
aliases:{'Qwen 3 Coder 480B':'qwen3-coder-480b-a35b'},
async fetch(){const t=tables(await fetchText(url)).find(t=>t[0]?.[1]?.text==='Model'&&t[0]?.[2]?.text==='Score');if(!t)throw new Error('Snorkel table missing');return t.slice(1).map(r=>({model:r[1].text,score:num(r[2].text)!,setting:'Pass@5'}));}};
export default board;
