// tweetSentBR evaluates sentiment classification for Brazilian Portuguese tweets.
// Table 4 of the paper reports per-class F measures and macro F measure for six classifiers.
import type {Leaderboard} from './types.ts';
import {pdfText} from '../lib/boards/pdf-text.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';
const FEED='http://www.lrec-conf.org/proceedings/lrec2018/pdf/389.pdf';
const rows=[['SVM',60.89,73.3,47.2,62.2],['NB',59.12,70.4,48.2,58.8],['LR',64.87,76.6,51.7,66.3],['MLP',64.60,76.3,51.9,65.6],['Dec. Tree',54.50,67.8,40.3,55.4],['Rand. F',62.18,74.9,43.2,68.4]] as const;
const board:Leaderboard={benchmark:'tweetsentbr',static:'paper',url:'http://www.lrec-conf.org/proceedings/lrec2018/summaries/389.html',feed:FEED,terms:'The LREC paper is available under the conference publication terms.',parts:{positiveF1:{name:'Positive F1'},neutralF1:{name:'Neutral F1'},negativeF1:{name:'Negative F1'}},async fetch(){const p=await pdfText(FEED);if(!p.includes('Table 4: Classification of TweetSentBR'))throw Error('tweetSentBR Table 4 missing');return checked(rows.map(([model,score,positiveF1,neutralF1,negativeF1])=>({model,score,metrics:{positiveF1,neutralF1,negativeF1}})),6)}};
export default board;
