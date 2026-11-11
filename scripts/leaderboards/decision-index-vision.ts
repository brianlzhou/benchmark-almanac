import type {Leaderboard} from './types.ts';
import {fetchJson} from '../lib/util.ts';
const FEED='https://huggingface.co/spaces/multimodalart/jev-decision-index/resolve/main/data/vision.json';
const board:Leaderboard={benchmark:'decision-index-vision',url:'https://huggingface.co/spaces/multimodalart/jev-decision-index',feed:FEED,terms:'Public author data mirrored under CC BY 4.0. The Almanac credits and links the source.',async fetch(){
 const d=await fetchJson<any>(FEED);return [...d.entrants,...d.refs].filter(r=>typeof r.full==='number').map(r=>({model:r.name,score:r.full,setting:r.ref?'Stock reference':r.kind,metrics:{public:r.pub,private:r.priv,...(typeof r.ms_row==='number'?{latency:r.ms_row/1000}:{})}}));
}};export default board;
