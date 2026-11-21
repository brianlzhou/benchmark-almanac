// OmniMedVQA tests medical visual question answering. Table 5 reports overall accuracy under two answer-selection protocols.
// Tables 5 to 7 also report accuracy by question type and imaging modality.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://openaccess.thecvf.com/content/CVPR2024/papers/Hu_OmniMedVQA_A_New_Large-Scale_Comprehensive_Evaluation_Benchmark_for_Medical_LVLM_CVPR_2024_paper.pdf';
const questions = ['Modality recognition','Anatomy identification','Disease diagnosis','Lesion grading','Other biological attributes'];
const modalities = ['Colposcopy','Computed tomography','Digital photography','Fundus photography','Infrared reflectance imaging',
  'Magnetic resonance imaging','Optical coherence tomography','Dermoscopy','Endoscopy','Microscopy','X-ray','Ultrasound'];
const board: Leaderboard = {
  benchmark: 'omnimedvqa', static: 'paper', feed, url: 'https://github.com/OpenGVLab/Multi-Modality-Arena/tree/main/MedicalEval',
  terms: 'CVF publishes the CVPR paper under the terms at https://openaccess.thecvf.com/menu.',
  aliases: { 'BLIP-2':'blip2-flan-t5-xl', InstructBLIP:'instructblip-vicuna-7b' },
  parts: Object.fromEntries([...questions,...modalities].map(name=>[name,{name,group:questions.includes(name) ? 'Question type' : 'Modality'}])),
  async fetch() {
    const pdf = await pdfText(feed);
    const start = pdf.indexOf('Table 5. The accuracy of representative LVLMs');
    const block = pdf.slice(start).split('Table 6. The overall accuracy of representative LVLMs');
    const modalityTables = block[1]?.split('Table 7. The overall accuracy of representative LVLMs');
    if (start < 0 || !block[0].includes('Overall') || !block[0].includes('Lesion') || modalityTables?.length !== 2) throw new Error('Missing OmniMedVQA results');
    const rows: LeaderboardRow[] = [];
    for (const [i,setting] of ['Question-answering','Prefix-based'].entries()) {
      const byModel = new Map<string,number[]>();
      if (!/Co\s+CT\s+DP\s+FP\s+IRI\s+MR\s+OCT\s+Der\s+End\s+Mic\s+X-Ray\s+US/.test(modalityTables[i])) throw new Error('Missing modality columns');
      for (const m of modalityTables[i].matchAll(/^ *([\w -]+?) \[\d+\][ \t]+(\d+\.\d+(?:[ \t]+\d+\.\d+){11})[ \t]*$/gm)) {
        byModel.set(m[1],m[2].split(/\s+/).map(numberCell));
      }
      for (const m of block[0].matchAll(/^ *([\w -]+?) \[\d+\][ \t]+([\d./ \t]+)$/gm)) {
        const pairs = [...m[2].matchAll(/(\d+\.\d+)\s*\/\s*(\d+\.\d+)/g)];
        const values = byModel.get(m[1]);
        if (pairs.length !== 6 || !values) throw new Error('Missing scores for ' + m[1]);
        const metrics = Object.fromEntries(questions.map((k,j)=>[k,Number(pairs[j][1+i])]));
        modalities.forEach((k,j)=>metrics[k]=values[j]);
        rows.push({model:m[1],setting,score:Number(pairs[5][1+i]),metrics});
      }
    }
    return checked(rows,24);
  },
};
export default board;
