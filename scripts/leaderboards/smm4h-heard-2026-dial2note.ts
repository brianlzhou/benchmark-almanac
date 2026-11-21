// The organizers rank MedSynth dialogue-to-note systems by the mean of five text similarity measures. Table 4 reports the five official team results.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = "https://aclanthology.org/2026.smm4h-1.53.pdf";


const board: Leaderboard = {
  benchmark: "smm4h-heard-2026-dial2note", static: 'paper',
  url: "https://www.codabench.org/competitions/14194",
  feed,
  terms: "The organizers publish the final scores in their ACL Anthology workshop paper. The competition and its robots.txt route returned a bot challenge.",
  async fetch(){
    const pdf=await pdfText(feed);
    const table=pdf.split(/Team\s+Avg\s+BLEU\s+ROUGE-1\s+ROUGE-2\s+ROUGE-L\s+METEOR\s+System Summary/)[1]?.split('Table 4:')[0];
    if(!table) throw new Error('Missing MedSynth table');
    const rows=[...table.matchAll(/^\s*([^\n]+?)\s+((?:0\.\d+\s+){5}0\.\d+)\s+[^\n]+/gm)].map(m=>{
      const [score,bleu,rouge1,rouge2,rougeL,meteor]=m[2].trim().split(/\s+/).map(Number);
      return {model:m[1].trim(),submitter:m[1].trim(),score,metrics:{bleu,rouge1,rouge2,rougeL,meteor}};
    });
    if(rows.length<5) throw new Error('Incomplete MedSynth standings');
    return rows;
  },
};
export default board;
