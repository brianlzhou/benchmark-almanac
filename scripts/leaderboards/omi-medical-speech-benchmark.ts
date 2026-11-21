// Medical word error rate, lower is better. Batch and realtime configurations stay separate.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText} from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED="https://omi.health/research/stt-benchmark";
const board:Leaderboard={benchmark:"omi-medical-speech-benchmark",url:FEED,feed:FEED,stats:{latency:{name:'Latency',unit:'seconds',better:'lower'},latencyP95:{name:'95th percentile latency',unit:'seconds',better:'lower'},wer:{name:'Word error rate',unit:'%',better:'lower'},drugErrors:{name:'Drug errors',unit:'%',better:'lower'},doseF1:{name:'Dose F1',unit:'%',better:'higher'}},
 terms:'Public maker results. The source robots.txt permits this public path or is absent. No additional restriction on reading these results is stated.',
 async fetch(){const ts=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));const out:LeaderboardRow[]=[];
for(const [i,t] of ts.filter(t=>t[0]?.includes('Medical WER ↓')).entries())for(const c of t.slice(1)){
 const seconds=(s:string)=>{const m=s?.match(/^([\d,.]+)\s*ms$/);return m?Number(m[1].replace(/,/g,''))/1000:undefined;};
 const latency=seconds(c[9]),p95=seconds(c[10]);
 const n=(s:string)=>Number(s.match(/^[\d.]+/)?.[0]);out.push({model:c[1],score:n(c[2]),setting:i===0?'batch':'realtime',metrics:{...(latency!==undefined?{latency}:{}),...(p95!==undefined?{latencyP95:p95}:{}),wer:n(c[3]),drugErrors:n(c[4]),doseF1:n(c[8])}});
 }
 return checked(out,3);
 }};export default board;
