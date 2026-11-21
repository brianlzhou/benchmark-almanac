// Labelbox compares generated videos using human preferences. Its leaderboard payload publishes Elo, TrueSkill, ranking shares and the distributions of human rating scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/video-generation/";

const board: Leaderboard = {
  benchmark: "video-generation-labelbox-2",
  url: "https://labelbox.com/leaderboards/video-generation/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service Its robots.txt restrictions cover CGI and PDF paths.",
  aliases: { 'Veo 3 (w/o audio)': 'veo-3' },
  async fetch() {
    type Entry = { label: string; elo_rating: number; average_rank: number; rank1_percentage: number; rank2_percentage: number; trueskill_rating: number;
      detailed_stats: Record<string, Record<string, number>> };
    const data = (await labelboxData(feed, 'video-generation')).info as Entry[];
    if (data.length < 7) throw new Error('Missing video generation models');
    return data.map(r => {
      if (!r.label || ![r.elo_rating, r.trueskill_rating, r.average_rank, r.rank1_percentage, r.rank2_percentage].every(Number.isFinite)) throw new Error('Incomplete video rating');
      const metrics: Record<string, number> = { trueSkill: r.trueskill_rating, averageRank: r.average_rank, first: r.rank1_percentage, second: r.rank2_percentage };
      for (const [category, ratings] of Object.entries(r.detailed_stats)) {
        for (const [key, value] of Object.entries(ratings)) if (Number.isFinite(value)) metrics[category + '_' + key] = value;
      }
      return { model: r.label, score: r.elo_rating, metrics };
    });
  },
};

export default board;
