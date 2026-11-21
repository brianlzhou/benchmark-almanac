// InteractSR is final success in the progressive find–navigate–sit episode.
// The table includes disturbance distances in meters. FindSR and NavSR are prerequisite-stage metrics, not independent benchmark scores.
import type {Leaderboard} from './types.ts';
import {fetchText} from '../lib/util.ts';
import {tables} from '../lib/html.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://human-claw.github.io/';
const board:Leaderboard={benchmark:'humanclaw-bench',url:URL,feed:URL,
 terms:'Public maker results on GitHub Pages; robots.txt has no restriction on this path.',
 stats:{
  findSuccess:{name:'Find success rate',unit:'%',better:'higher',note:'Target rendered in ego view and acknowledged by the model.'},
  navigateSuccess:{name:'Navigate success rate',unit:'%',better:'higher',note:'Agent comes within 20 centimeters of the target and stops.'},
  collisions:{name:'Collision rate',unit:'%',better:'lower',note:'Floor-relative non-ground collision step fraction.'},
  disturbances:{name:'Object disturbances per episode',unit:'count',better:'lower'},
  disturbanceMeters:{name:'Object disturbance distance',unit:'score',better:'lower',note:'Distance in meters that contact displaces an object.'},
  motionJerk:{name:'Motion jerk',unit:'score',better:'lower',note:'Root-rigid jerk at approximately 0.27 second timescale.'},
  steps:{name:'Average steps',unit:'count',better:'lower'},
  inputTokensPerStep:{name:'Input tokens per step',unit:'tokens',better:'lower'},
  outputTokensPerStep:{name:'Output tokens per step',unit:'tokens',better:'lower'},
 },
 async fetch(){const t=tables(await fetchText(URL)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[1]?.includes('InteractSR'));if(!t)throw new Error('Progressive success table missing');
 return checked(t.slice(2).map(c=>({model:/^(GPT-6|Gemini-3.1|Gemini-2.5|Claude-4.8)$/.test(c[0])?c[0]+' (variant unspecified)':c[0],score:parseFloat(c[3]),harness:'HumanCLAW',metrics:{findSuccess:parseFloat(c[1]),navigateSuccess:parseFloat(c[2]),collisions:parseFloat(c[4]),disturbances:Number(c[5]),disturbanceMeters:parseFloat(c[6]),motionJerk:Number(c[7]),steps:Number(c[8]),inputTokensPerStep:Number(c[9]),outputTokensPerStep:Number(c[10])}})),3);
 }};export default board;
