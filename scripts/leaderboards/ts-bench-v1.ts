// Frozen v1-final: 25 Exercism tasks, separate from the v2 SWE-Lancer task set.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
const FEED='https://raw.githubusercontent.com/laiso/ts-bench/v1-final/README.md';
const board:Leaderboard={benchmark:'ts-bench-v1',url:'https://github.com/laiso/ts-bench/tree/v1-final',feed:FEED,
terms:'Official frozen README leaderboard. The almanac credits and links the source.',
async fetch(){const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Success Rate'));if(!t)throw new Error('ts-bench v1 table missing');
return t.slice(1).map(r=>({model:r[2].replace(/^[^/]+\//,''),harness:r[1],score:num(r[3])!,metrics:{latency:num(r[5])!}}));}};export default board;
