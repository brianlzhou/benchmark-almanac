// AerialSim evaluates closed-loop drone navigation and coding missions.
// The project results page reports complete mission success on 56 held-out missions.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const feed='https://nahidalam.github.io/posts/aerialsim-env/';
const board:Leaderboard={benchmark:'aerialsim',url:feed,feed,static:'paper',terms:'The AerialSim project publishes these benchmark results on its project site. '+feed,async fetch(){const p=await fetchText(feed);if(!p.includes('11/56')||!p.includes('19/56')||!p.includes('41 of the same 56'))throw Error('AerialSim results changed');return checked([{model:'Qwen3.5-4B',score:19.6,setting:'Base'},{model:'Qwen3.5-4B',score:33.9,setting:'Trained'},{model:'Claude Haiku 4.5',score:73.2,setting:'Reference'}],3);}};export default board;
