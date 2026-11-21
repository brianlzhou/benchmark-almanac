// ChessBench tests chess move and puzzle prediction on positions from searchless_chess.
// The headline is the paper's Puzzle Accuracy percentage in Table 1.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {paperHtml, PAPER_TERMS} from '../lib/boards/arxiv-throttled.ts';
import {paperTables, grid, checked} from '../lib/boards/arxiv-span-tables.ts';
const URL='https://arxiv.org/html/2402.04494';
const board: Leaderboard={benchmark:'chessbench', static:'paper', url:'https://github.com/google-deepmind/searchless_chess', feed:URL, terms:PAPER_TERMS,
  async fetch(){
    const table=paperTables(await paperHtml(URL)).map(grid).find(t=>t.some(r=>r.includes('Puzzle Acc. (%)')));
    if(!table) throw new Error('ChessBench Table 1 missing');
    const rows:LeaderboardRow[]=[];
    for(const c of table.slice(2)){const model=c[0]?.trim(); const score=Number(c.at(-1)); if(!model||!Number.isFinite(score)) throw new Error('ChessBench row changed'); if(/\[oracle\]/.test(model)) continue; rows.push({model:model.replace(/ \(ours\)$/,''), score, setting:c[1]||undefined, metrics:{tournamentElo:Number.parseFloat(c[4]), puzzleAccuracy:score}});}
    return checked(rows,8);
  }};
export default board;
