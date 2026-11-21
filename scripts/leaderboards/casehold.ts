// CaseHOLD: Table 5 reports mean macro F1 over ten folds. Fractions become percentages.
// Read the reported 95% intervals, fold count, pretraining steps and vocabulary sizes.
// The paper identifies the baseline as a one-layer BiLSTM. All five systems are fine-tuned on CaseHOLD.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2104.08671";
import { paperTables } from '../lib/boards/arxiv-nested-tables.ts';
const board: Leaderboard = {
  benchmark: "casehold", static: 'paper',
  url: "https://github.com/reglab/casehold",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  stats: {
    pretrainingSteps: { name: 'Pretraining steps', unit: 'count' },
    vocabularySize: { name: 'Vocabulary size', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const t=(await paperTables(FEED))[4],r=t?.find(r=>r[0]?.text.startsWith('CaseHOLD'));
    if(r?.length!==6)throw new Error('CaseHOLD results changed');
    const models=['BiLSTM (CaseHOLD fine-tuned)','BERT-base-uncased (CaseHOLD fine-tuned)','BERT-base-uncased double pretraining (CaseHOLD fine-tuned)','Legal-BERT (CaseHOLD paper, fine-tuned)','Custom Legal-BERT (CaseHOLD fine-tuned)'];
    const pretraining=t.find(row=>row[0]?.text==='Number of Pretraining Steps');
    const vocabulary=t.find(row=>row[0]?.text.startsWith('Vocabulary Size'));
    return models.map((model,i)=>{
      const cell=r[i+1].text;
      const score=Number((num(cell)!*100).toFixed(2));
      const margin=cell.match(/(?:±|\\pm)\s*([\d.]+)/);
      const half=margin ? Number(margin[1])*100 : undefined;
      const metrics:Record<string,number>={};
      const steps=pretraining?.[i+1]?.text.match(/^([\d.]+)M$/);
      const vocab=vocabulary?.[i+1]?.text.match(/^([\d,]+)/);
      if (steps) metrics.pretrainingSteps=Number(steps[1])*1e6;
      if (vocab) metrics.vocabularySize=Number(vocab[1].replaceAll(',',''));
      return {model, score, trials:10, low:half===undefined?undefined:Number((score-half).toFixed(2)),
        high:half===undefined?undefined:Number((score+half).toFixed(2)),metrics};
    });
  },
};
export default board;
