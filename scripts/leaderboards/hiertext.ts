// HierText tests text detection at the word, line and paragraph levels in scene images.
// The ICDAR competition report ranks Task 1 by H-PQ, the harmonic mean of panoptic quality at all three levels.
// Read the named model submissions for which the report identifies a submitter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/google-research-datasets/hiertext/main/docs/images/ICDAR_2023_Competition_on_Hierarchical_Text_Detection_and_Recognition_result_and_ranking_.pdf';
const entries = [
  {model:'DeepSE hierarchical detection model',submitter:'DeepSE x Upstage',check:'DeepSE hierarchical'},
  {model:'NVTextSpotter',submitter:'Mike Ranzinger',check:'NVTextSpotter'},
  {model:'Clova DEER',submitter:'ssm',check:'Clova DEER detection',harness:'Ensemble of three task-specific models'},
  {model:'Hierarchical Transformers for Text Detection',submitter:'Asaf Gendler',check:'Hierarchical Transformers'},
  {model:'DQ-DETR',submitter:'Jiawei Wang',check:'DQ-DETR'},
];
const levels = ['Word','Line','Paragraph'];
const measures = ['Panoptic quality','F1','Precision','Recall','Tightness'];
const keys = levels.flatMap(level => measures.map(m => level+' '+m));
const board:Leaderboard = {
  benchmark:'hiertext',url:'https://github.com/google-research-datasets/hiertext',feed,
  terms:'The organizers publish the competition results in the HierText repository. https://github.com/google-research-datasets/hiertext#license',
  parts:Object.fromEntries(keys.map(name => [name,{name,unit:'%' as const}])),
  headline:'The headline is the ICDAR competition’s H-PQ for hierarchical text detection.',
  async fetch() {
    const table = (await pdfText(feed)).split('Table 1. Results for Task 1.')[0];
    if (!table.includes('H-PQ') || !table.includes('Paragraph')) throw new Error('Missing Task 1 table');
    const rows:LeaderboardRow[] = entries.map(({model,submitter,check,harness}) => {
      const line = table.split('\n').find(l => l.trimStart().startsWith(submitter+' '));
      if (!line || !table.includes(check)) throw new Error('Missing HierText submission: '+model);
      const tail = line.match(/(?:\s+\d+\.\d+){16}\s*$/);
      if (!tail) throw new Error('Missing H-PQ or submetric');
      const [score,...parts] = tail[0].trim().split(/\s+/).map(Number);
      return {model,submitter,harness,score,metrics:Object.fromEntries(keys.map((k,i) => [k,parts[i]]))};
    });
    return checked(rows,5);
  },
};
export default board;
