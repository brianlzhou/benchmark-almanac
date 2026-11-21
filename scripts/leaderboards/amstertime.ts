// AmsterTime tests recognition of places across historical and modern images.
// The README describes verification as auxiliary. The headline is mAP, the first
// retrieval metric, converted from a fraction to a percentage.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/seyrankhademi/AmsterTime/HEAD/README.md';
const board: Leaderboard = {
  benchmark:'amstertime', url:'https://github.com/seyrankhademi/AmsterTime#results', feed,
  terms:'The authors publish their evaluated features and result table in the AmsterTime repository. https://github.com/seyrankhademi/AmsterTime',
  headline:'The headline is mean average precision on retrieval. The authors also report an auxiliary verification task.',
  parts:{precision:'Verification precision',recall:'Verification recall',f1:'Verification F1',acc:'Verification accuracy',auc:'Verification ROC AUC',top1:'Retrieval Top1',top5:'Retrieval Top5'},
  async fetch() {
    const table = (await fetchText(feed)).split('which are given in the table below:')[1]?.split('##')[0];
    const lines = table?.split(/\r?\n/).filter(s => s.startsWith('|')).map(s => s.split('|').slice(1,-1).map(c => c.replaceAll('**','').trim()));
    if (lines?.[2]?.join('|') !== 'Method|Train Dataset|Precision|Recall|F1|Acc|ROC AUC|mAP|Top1|Top5') throw new Error('Missing retrieval columns');
    const rows = lines.slice(3).filter(c => c[0] !== 'SIFT w/ BoVW').map(([model,training,...cells]) => {
      if (cells.length !== 8 || cells.some(c => !/^\d+\.\d+$/.test(c))) throw new Error('Unexpected AmsterTime row');
      const [precision,recall,f1,acc,auc,score,top1,top5] = cells.map(c => Math.round(Number(c)*10000)/100);
      return {model,setting:'Trained on '+training,score,metrics:{precision,recall,f1,acc,auc,top1,top5}};
    });
    return checked(rows,12);
  },
};
export default board;
