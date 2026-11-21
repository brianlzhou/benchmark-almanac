// Overall score, dimension averages, error classes and model group from the paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
import {inlinePaperTables} from '../lib/boards/arxiv-inline-tables.ts';
const URL="https://arxiv.org/html/2501.03124";
const board:Leaderboard={benchmark:'prmbench', static: 'paper', parts: {
  simplicity: { name: 'Simplicity', group: 'Dimension' },
  soundness: { name: 'Soundness', group: 'Dimension' },
  sensitivity: { name: 'Sensitivity', group: 'Dimension' },
},url:URL,feed:URL,terms:PAPER_TERMS,
 async fetch(){const t=inlinePaperTables(await paperHtml(URL)).find(t=>t[0]?.[1]==='Overall'&&t[0]?.length===14);if(!t)throw new Error('Reviewed overall table missing');const out:LeaderboardRow[]=[];
 let open: boolean | undefined;
 let setting: string | undefined;
 const parts = board.parts ?? {};
 for (const c of t.slice(2)) {
   if (c[0] === c[1]) {
     open = c[0].startsWith('Open') ? true : c[0].startsWith('Proprietary') ? false : undefined;
     setting = c[0].includes('Prompted as Critic') ? 'prompted as critic' : undefined;
     continue;
   }
   if (c[0] === 'Avg.' || c[0].startsWith('Human') || !/^[-\d.]+$/.test(c[1])) continue;
   const metrics: Record<string, number> = {simplicity:Number(c[4]),soundness:Number(c[9]),sensitivity:Number(c[13])};
   for (const i of [2, 3, 5, 6, 7, 8, 10, 11, 12]) {
     const name = t[1][i].replace(/\.$/, '');
     const key = name.toLowerCase();
     parts[key] = {name, group: t[0][i]};
     if (/^[-\d.]+$/.test(c[i])) metrics[key] = Number(c[i]);
   }
   out.push({model:c[0].replace(/ †$/,''),score:Number(c[1]),open,setting,metrics});
 }
 board.parts = parts;
 return checked(out,3);
 }};export default board;
