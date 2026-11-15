// The makers' aggregate excludes project completion. Mean Score uses their min-max task normalization.
import type {Leaderboard} from './types.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {fetchText} from '../lib/util.ts';
const FEED='https://huggingface.co/datasets/JetBrains-Research/lca-results/raw/main/aggregated/agg_results.jsonl';
const board:Leaderboard={benchmark:'long-code-arena',url:'https://huggingface.co/spaces/JetBrains-Research/long-code-arena',feed:FEED,
 terms:'Public maker aggregate results; Hugging Face robots.txt permits the raw file. The project requires open-access publications for research using its GitHub-derived datasets.',
 aliases:{'GPT-o1':'o1'},
 async fetch(){
  const data=(await fetchText(FEED)).trim().split(/\r?\n/).map(line=>JSON.parse(line) as Record<string,unknown>);
  const rows=data.map(r=>({model:String(r.Model),score:Number(r['Mean Score']),metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>k!=='Mean Score'&&typeof v==='number')) as Record<string,number>}));
  if(rows.length<3||rows.some(r=>!Number.isFinite(r.score)))throw new Error('Invalid aggregate rows');return checked(rows,3);
 }};export default board;
