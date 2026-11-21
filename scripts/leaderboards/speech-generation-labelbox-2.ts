// Labelbox rates speech generators from human pairwise preferences. The headline is the Elo rating.
// Its embedded results include TrueSkill, preference shares and the breakdown of human ratings.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/speech-generation/";
interface Entry {label:string; elo_rating:number; average_rank:number; trueskill_rating:number; rank1_percentage:number; rank2_percentage:number; detailed_stats:Record<string,Record<string,number>>}

const board: Leaderboard = {
  benchmark: "speech-generation-labelbox-2",
  url: "https://labelbox.com/leaderboards/speech-generation/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service Robots.txt permits the leaderboard.",
  async fetch() {
    const { info } = await labelboxData(feed,'speech-generation') as {info:Entry[]};
    if (info.length < 9) throw new Error('Missing Labelbox speech models');
    return info.map(r=>{
      if (!r.label || !Number.isFinite(r.elo_rating)) throw new Error('Missing Elo rating');
      const metrics:Record<string,number> = {averageRank:r.average_rank, trueSkill:r.trueskill_rating, rank1:r.rank1_percentage, rank2:r.rank2_percentage};
      for (const [dimension,ratings] of Object.entries(r.detailed_stats))
        for (const [label,share] of Object.entries(ratings)) metrics[dimension+'_'+label] = share;
      return {model:r.label,score:r.elo_rating,metrics};
    });
  },
};
export default board;
