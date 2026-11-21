// SemEval-2015 Task 1 evaluates Twitter paraphrase identification and semantic similarity.
// Table 3 in the shared-task paper reports named system scores for both subtasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const FEED='https://aclanthology.org/S15-2001.pdf';
const board:Leaderboard={benchmark:'semeval-2015-task-1',static:'paper',url:'https://aclanthology.org/S15-2001/',feed:FEED,terms:'ACL Anthology makes this paper available under its stated publication terms. https://aclanthology.org/S15-2001/',headline:'The paper reports two subtasks, so this is the plain mean of F1 and Pearson scores.',parts:{f1:'F1',pearson:'Pearson'},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 3: Evaluation results'))throw new Error('SemEval Table 3 missing');const rows:LeaderboardRow[]=[{model:'ECNU',score:(0.742+0.724)/2,metrics:{f1:0.742,pearson:0.724}},{model:'MITRE',score:(0.743+0.710)/2,metrics:{f1:0.743,pearson:0.710}},{model:'DEPTH',score:(0.61912+0.5188)/2,metrics:{f1:0.61912,pearson:0.5188}}];return checked(rows,3)}};export default board;
