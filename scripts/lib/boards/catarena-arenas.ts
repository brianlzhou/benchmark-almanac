// Independent CATArena competitions. Their displayed measures are not an overall average rank.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';
export const CAT_FEED='https://catarena.ai/api/ranks/games';
export const CAT_TERMS='Public CATArena competition API. Site terms apply. The almanac credits and links the source.';
export async function catRows(game:string, metric:string):Promise<LeaderboardRow[]> {
  const data=await fetchJson<{game_type:string;score_feild_name:string;agents:{name:string;score:number;rank:number}[]}[]>(CAT_FEED);
  const board=data.find(b=>b.game_type===game);
  if(!board || board.score_feild_name!==metric) throw new Error(`CATArena ${game} metric changed`);
  const rows:LeaderboardRow[]=board.agents.filter(r=>r.name&&Number.isFinite(r.score)).map(r=>{
    const m=r.name.match(/^(.*?)\s*\((Minimal)\)$/i);
    let model=m?.[1]??r.name;
    // Harness-only entries and undated model families stay unlisted.
    if (/^(?:OpenAI Codex|GPT Codex|Claude Code|Qwen Code(?: CLI)?|Gemini CLI)$/i.test(model)) model+=' [base model unspecified]';
    if (/^(?:Qwen 3 Coder|Gemini 2.5 Pro|Doubao Seed 1.6)$/i.test(model)) model+=' [variant unspecified]';
    return {model,score:r.score,setting:m?.[2].toLowerCase(),metrics:{rank:r.rank}};
  });
  if(!rows.length)throw new Error(`CATArena ${game} empty`);
  return rows;
}
