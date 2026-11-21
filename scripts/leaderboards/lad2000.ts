// LAD2000 evaluates video anomaly detection with frame-level AUC. Table 3 reports each method's AUC on the LAD dataset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2106.08570';
const board:Leaderboard={benchmark:'lad2000',url:feed,feed,static:'paper',terms:'The authors publish the results on arXiv. '+feed.replace('/html/','/abs/'),async fetch(){
 const h=await paperHtml(feed),plain=h.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '), names=['Sparse','ConvAE','GMM','Stacked RNN','U-Net','MNAD','OGNet','DeepMIL','MLEP','AR-Net'];
 const rows:LeaderboardRow[]=[]; for(const name of names){const i=plain.indexOf(name);const part=plain.slice(i,i+500);const nums=[...part.matchAll(/(?:\\d+\\.\\d+)\\*?/g)].map(m=>m[0].replace('*','')).map(Number);const score=nums.at(-1);if(typeof score !== 'number' || !Number.isFinite(score))throw new Error('Missing LAD AUC '+name);rows.push({model:name,score});} return checked(rows,10);
}}; export default board;
