// MMIU overall accuracy with all 52 task metrics.
// Two HTML rows describe each model; frequency and random baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const FEED = "https://mmiu-bench.github.io/";
const board: Leaderboard = {
 benchmark: "mmiu", parts: {
  CR: { name: 'Causality reasoning', group: 'Task type' },
  GuAR: { name: 'GUI app recognition', group: 'Task type' },
  ER: { name: 'Emotion recognition', group: 'Task type' },
  GNAP: { name: 'GUI next action prediction', group: 'Task type' },
  FD: { name: 'Forensic detection', group: 'Task type' },
  TC: { name: 'Textual cloze', group: 'Task type' },
  FC: { name: 'Functional correspondence', group: 'Task type' },
  VClz: { name: 'Visual cloze', group: 'Task type' },
  SC: { name: 'Semantic correspondence', group: 'Task type' },
  VCo: { name: 'Visual coherence', group: 'Task type' },
  VCor: { name: 'Visual correspondence', group: 'Task type' },
  VO: { name: 'Visual ordering', group: 'Task type' },
  VQA: { name: 'Visual quality assessment', group: 'Task type' },
  EVQA: { name: 'Egocentric video QA', group: 'Task type' },
  VGR: { name: 'Visually grounded reasoning', group: 'Task type' },
  HE: { name: 'Homography estimation', group: 'Task type' },
  FR: { name: 'Face retrieval', group: 'Task type' },
  IQASC: { name: 'Icon QA with spatial context', group: 'Task type' },
  HR: { name: 'Handwritten retrieval', group: 'Task type' },
  ICSC: { name: 'Image captioning with spatial context', group: 'Task type' },
  I2IR: { name: 'Image to image retrieval', group: 'Task type' },
  ISTE: { name: 'Image spatial transformation estimation', group: 'Task type' },
  MIC: { name: 'Multiple image captioning', group: 'Task type' },
  ITRSC: { name: 'Image text retrieval with spatial context', group: 'Task type' },
  PR: { name: 'Person re-identification', group: 'Task type' },
  MAR: { name: 'Multiview action recognition', group: 'Task type' },
  S2IR: { name: 'Sketch to image retrieval', group: 'Task type' },
  MR: { name: 'Multiview reasoning', group: 'Task type' },
  JPS: { name: 'Jigsaw puzzle solving', group: 'Task type' },
  STS: { name: 'Spot the similarity', group: 'Task type' },
  '3DE': { name: '3D depth estimation', group: 'Task type' },
  T2IR: { name: 'Text to image retrieval', group: 'Task type' },
  '3DOD': { name: '3D object detection', group: 'Task type' },
  VR: { name: 'Vehicle retrieval', group: 'Task type' },
  '3DOT': { name: '3D object tracking', group: 'Task type' },
  AQA: { name: 'Action quality assessment', group: 'Task type' },
  '3DPE': { name: '3D pose estimation', group: 'Task type' },
  GAR: { name: 'General action recognition', group: 'Task type' },
  '3DSR': { name: '3D scene reconstruction', group: 'Task type' },
  MVU: { name: 'Meme video understanding', group: 'Task type' },
  '3DQA': { name: '3D QA', group: 'Task type' },
  MEV: { name: 'MeViS', group: 'Task type' },
  PT: { name: 'Point tracking', group: 'Task type' },
  NIP: { name: 'Next image prediction', group: 'Task type' },
  RPM: { name: 'Raven\'s progressive matrices', group: 'Task type' },
  TL: { name: 'Temporal localization', group: 'Task type' },
  SOT: { name: 'Single object tracking', group: 'Task type' },
  TO: { name: 'Temporal ordering', group: 'Task type' },
  '3DCR': { name: '3D CAD recognition', group: 'Task type' },
  VidCap: { name: 'Video captioning', group: 'Task type' },
  '3DIR': { name: '3D indoor recognition', group: 'Task type' },
  STD: { name: 'STD', group: 'Task type' },
}, url: "https://mmiu-bench.github.io/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text==='Overall');if(!t)throw new Error('Missing MMIU table');
const rows:LeaderboardRow[]=[];
for(let i=2;i<t.length;i+=2){const r=t[i],next=t[i+1],name=r[0]?.text,score=num(r[1]?.text);
 if(!name||/^(Frequency|Random)$/i.test(name)||score===undefined)continue;
 const metrics:Record<string,number>={};for(let j=2;j<r.length;j++){const a=num(r[j]?.text),b=num(next?.[j]?.text);if(a!==undefined)metrics[t[0][j].text]=a;if(b!==undefined)metrics[t[1][j].text]=b;}
 const model=/^(GPT-4[ov]?|Gemini[- ]1\.5[- ](?:Pro|Flash))$/i.test(name)?name+' [snapshot unspecified]':name;
 rows.push({model,score,metrics});}return rows;
 },
};
export default board;
