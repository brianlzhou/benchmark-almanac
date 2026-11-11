// GenAI-Arena anonymous-vote Elo by image generation, editing and video tracks.
// The full-vote Elo is retained as a separate metric. Scores from different tracks remain separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/TIGER-Lab/GenAI-Arena/resolve/main/arena_elo/results/latest/";
const board: Leaderboard = {
 benchmark: "genai-arena", url: "https://huggingface.co/spaces/TIGER-Lab/GenAI-Arena", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const rows:LeaderboardRow[]=[];
for(const track of ['t2i_generation','image_editing','video_generation']){
 if(rows.length)await new Promise(r=>setTimeout(r,2100));
 const data=parseCsv(await fetchText(FEED+track+'_leaderboard.csv'));
 for(const r of data){const score=num(r['Arena Elo rating (anony)']);if(!r.Model||score===undefined)continue;
 const full=num(r['Arena Elo rating (full)']);rows.push({model:r.Model,score,setting:track+'; anonymous votes',metrics:full===undefined?undefined:{fullVoteElo:full}});}
}return rows;
 },
};
export default board;
