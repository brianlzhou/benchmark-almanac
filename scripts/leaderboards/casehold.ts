// CaseHOLD: Table 5 reports mean macro F1 over ten folds. Fractions become percentages.
// The paper identifies the baseline as a one-layer BiLSTM. All five systems are fine-tuned on CaseHOLD.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2104.08671";
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "casehold",
  url: "https://github.com/reglab/casehold",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[4],r=t?.find(r=>r[0]?.text.startsWith('CaseHOLD'));
    if(r?.length!==6)throw new Error('CaseHOLD results changed');
    const models=['BiLSTM (CaseHOLD fine-tuned)','BERT-base-uncased (CaseHOLD fine-tuned)','BERT-base-uncased double pretraining (CaseHOLD fine-tuned)','Legal-BERT (CaseHOLD paper, fine-tuned)','Custom Legal-BERT (CaseHOLD fine-tuned)'];
    return models.map((model,i)=>({model,score:Number((num(r[i+1].text)!*100).toFixed(2))}));
  },
};
export default board;
