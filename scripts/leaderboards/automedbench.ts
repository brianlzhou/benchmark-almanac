// Whole-benchmark results from the makers' paper.
import type {Leaderboard,LeaderboardRow} from './types.ts';
import {paperHtml,PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables,grid,checked} from '../lib/boards/arxiv-span-tables.ts';
const URL="https://arxiv.org/html/2606.01961";
const board:Leaderboard={benchmark:"automedbench", static: 'paper',url:URL,feed:URL,terms:PAPER_TERMS,aliases:{"Opus 4.6": "claude-opus-4-6", "ChatGPT-5.4": "gpt-5-4", "Qwen3.5": "qwen3-5-397b-a17b"},
parts: {
  segmentation: { name: 'Segmentation', group: 'Task type' },
  enhancement: { name: 'Enhancement', group: 'Task type' },
  vqa: { name: 'VQA', group: 'Task type' },
  reports: { name: 'Reports', group: 'Task type' },
  detection: { name: 'Detection', group: 'Task type' },
},
 async fetch(){const ts=paperTables(await paperHtml(URL)).map(grid);const t=ts.find(t=>JSON.stringify(t[0])==="[\"Agent\",\"Segmentation\",\"Enhancement\",\"Visual Question Answering\",\"Report Generation\",\"Detection\",\"Overall\"]");
 if(!t)throw new Error('Reviewed results table missing');const out:LeaderboardRow[]=[];
 for(const c of t.slice(1))out.push({model:c[0].replace(/\s*\[.*\]/,''),score:Number(c[6]),setting:'paper release; 24 tasks; Lite and Standard',metrics:{segmentation:Number(c[1]),enhancement:Number(c[2]),vqa:Number(c[3]),reports:Number(c[4]),detection:Number(c[5])}});
 return checked(out,3);
 }};export default board;
