// The authors link their Kaggle leaderboard from the writeup. Its Overall score averages accuracy on the English and bilingual proverb tracks.
import type { Leaderboard } from './types.ts';
import { kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const feed = "https://www.kaggle.com/api/v1/benchmarks/janeodum/naijaproverb-bench/leaderboard";


const board: Leaderboard = {
  benchmark: "naijaproverb-bench",
  url: "https://www.kaggle.com/competitions/kaggle-measuring-agi/writeups/naijaproverb-bench-measuring-social-cognition-bey",
  feed,
  terms: "The authors show a leaderboard image and report both tracks. The writeup gives no explicit score reuse license. https://www.kaggle.com/competitions/kaggle-measuring-agi/writeups/naijaproverb-bench-measuring-social-cognition-bey Kaggle publishes a public leaderboard API. Its robots.txt route returned HTML.",
  parts:{english:'naijaproverb_v3', bilingual:'naijaproverb_bilingual'},
  async fetch(){
    const rows = await kaggleRowsWithBounds('janeodum','naijaproverb-bench','(Overall)',100,{
      english:{task:'naijaproverb_v3',scale:100}, bilingual:{task:'naijaproverb_bilingual',scale:100}});
    if(rows.length < 19 || rows.some(r => r.metrics?.english === undefined || r.metrics.bilingual === undefined)) throw new Error('Incomplete proverb scores');
    return rows;
  },
};
export default board;
