// The Hateful Memes Challenge tests whether a classifier can recognize hateful multimodal memes.
// DrivenData lists the Phase 2 winners by unseen-test AUROC. The linked solution descriptions identify each team's model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/drivendataorg/hateful-memes/HEAD/README.md';
const solutions: Record<string, Pick<LeaderboardRow,'model'|'models'|'setting'>> = {
  'alfred lab': { model:'extended VL-BERT', models:['extended VL-BERT','UNITER-ITM','VILLA-ITM','ERNIE-Vil'],setting:'Averaged predictions with rule-based postprocessing' },
  Muennighoff:{model:'VILIO',setting:'VILIO ensemble'},
  HateDetectron:{model:'VisualBERT',setting:'Majority voting'},
  kingsterdam:{model:'UNITER-base',setting:'Weighted cross-validation ensemble'},
  burebista:{model:'UNITER',setting:'12-model probability average'},
};
const board: Leaderboard = {
  benchmark:'hateful-memes-challenge', host:'DrivenData', url:'https://github.com/drivendataorg/hateful-memes#winning-submissions',feed,
  terms:'DrivenData competition terms: https://www.drivendata.org/competitions/70/hateful-memes-phase-2/rules/',
  async fetch() {
    const readme = await fetchText(feed);
    const section = readme.split('Place | Team or User | Code | Paper | Score | Summary of Model')[1];
    if (!section) throw Error('Missing Phase 2 winning submissions');
    const rows = section.split('\n').filter(line => /^\d+\s*\|/.test(line)).map(line => {
      const [,submitter,code,,value] = line.split('|').map(s=>s.trim());
      if (!solutions[submitter] || !/^0\.\d+$/.test(value)) throw Error('Unreviewed Phase 2 submission for '+submitter);
      return { ...solutions[submitter], submitter, score:Number(value)*100, link:code.match(/\((https:[^)]+)\)/)?.[1] };
    });
    return checked(rows,5);
  },
};
export default board;
