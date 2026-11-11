// Separate vote pools from the GenAI-Arena authors' published CSVs.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, parseCsv } from '../util.ts';
import { num } from '../html.ts';
export const GENAI_BASE='https://huggingface.co/spaces/TIGER-Lab/GenAI-Arena/resolve/main/arena_elo/results/latest/';
export async function genaiRows(track:string):Promise<LeaderboardRow[]> {
  const rows:LeaderboardRow[]=[];
  for(const r of parseCsv(await fetchText(GENAI_BASE+track+'_leaderboard.csv'))){
    const score=num(r['Arena Elo rating (anony)']);
    if(!r.Model||score===undefined)continue;
    const full=num(r['Arena Elo rating (full)']);
    rows.push({model:r.Model,score,metrics:full===undefined?undefined:{fullVoteElo:full}});
  }
  if(!rows.length)throw new Error(`GenAI-Arena ${track} empty`);
  return rows;
}
