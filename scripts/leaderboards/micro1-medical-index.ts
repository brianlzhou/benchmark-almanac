// micro1 Medical Index. A static micro1 report page (see realmpathology.ts, micro1Data): the page's
// leaderboard card is an inline data literal, window.benchmarks_data["medical-index"], read as data. Its default tab,
// the composite index (0 to 100), is the score.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { MICRO1_ALIASES, MICRO1_TERMS } from './realmpathology.ts';

const PAGE = 'https://www.micro1.ai/benchmark/medical-index';

const board: Leaderboard = {
  benchmark: 'micro1-medical-index',
  url: PAGE,
  feed: `${PAGE} (inline leaderboard data "medical-index", the composite index)`,
  terms: MICRO1_TERMS,
  aliases: MICRO1_ALIASES,
  async fetch() {
    const html=await fetchText(PAGE);const at=html.indexOf('window.benchmarks_data["medical-index"] =');
    if(at<0)throw new Error('Medical Index data missing');
    const data=jsLiteral<{tabs:{rows:{name:string;score:number;benchmarks?:Record<string,number>}[]}[]}>(html,html.indexOf('{',at));
    const rows=data.tabs[0]?.rows;if(!rows?.length)throw new Error('Medical Index rows missing');
    return rows.map(r=>({model:r.name,score:r.score,metrics:r.benchmarks}));
  },
};
export default board;
