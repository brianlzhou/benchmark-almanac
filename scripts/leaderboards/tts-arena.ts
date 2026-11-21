// TTS Arena v2 publishes Elo estimates through a public JSON API. Preserve uncertainty, win rates, votes,
// open weights, preliminary status and inactive systems. Names remain unlisted unless they identify a registry model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
const FEED='https://tts-agi-tts-arena-v2.hf.space/api/leaderboard';
interface Row{open:boolean;name:string;elo:number;uncertainty:number;winRate:number;totalVotes:number;preliminary:boolean;active:boolean;suspended:boolean}
const board:Leaderboard={benchmark:'tts-arena',url:'https://huggingface.co/spaces/TTS-AGI/TTS-Arena-V2',feed:FEED,terms:'Public TTS Arena API, subject to the Space repository license and Hugging Face terms.',stats:{winRate:{name:'Win rate',unit:'%',better:'higher'},votes:{name:'Votes',unit:'count'}},async fetch(){
 const {rows}=await fetchJson<{rows:Row[]}>(FEED);const out:LeaderboardRow[]=rows.filter(r=>r.name&&Number.isFinite(r.elo)).map(r=>({model:r.name,score:r.elo,setting:'v2',open:r.open,...(Number.isFinite(r.uncertainty)?{low:r.elo-r.uncertainty,high:r.elo+r.uncertainty}:{}),metrics:{winRate:r.winRate,votes:r.totalVotes,preliminary:Number(r.preliminary),active:Number(r.active),suspended:Number(r.suspended)}}));
 if(!out.length)throw new Error('No TTS Arena ratings');return out;
}};
export default board;
