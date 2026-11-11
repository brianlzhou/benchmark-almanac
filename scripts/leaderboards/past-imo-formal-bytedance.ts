// The README publishes a rounded 79%, not the paper's 78.1%.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED='https://raw.githubusercontent.com/ByteDance-Seed/Seed-Prover/main/SeedProver/README.md';
const board:Leaderboard={benchmark:'past-imo-formal-bytedance',url:'https://github.com/ByteDance-Seed/Seed-Prover/tree/main/SeedProver',feed:FEED,terms:'Public official repository results. The Almanac credits and links the source.',async fetch(){
 const text=await fetchText(FEED),m=text.match(/\| Past IMO\s*\|\s*([\d.]+)%\s*\(Heavy\)/);
 if(!m)throw new Error('Past IMO Heavy row missing');
 return [{model:'Seed Prover',score:Number(m[1]),setting:'Heavy',harness:'Seed Prover multi-agent inference'}];
}};export default board;
