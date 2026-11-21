// Labelbox compares generated images using human preferences. Its leaderboard payload publishes Elo, TrueSkill, ranking shares and the distributions of human rating scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/image-generation/";

const board: Leaderboard = {
  benchmark: "image-generation-labelbox-2",
  url: "https://labelbox.com/leaderboards/image-generation/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service Its robots.txt restrictions cover CGI and PDF paths.",
  stats: {
    trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' },
    averageRank: { name: 'Average rank', unit: 'count', better: 'lower' },
    first: { name: 'Ranked first share', unit: '%', better: 'higher' },
    second: { name: 'Ranked second share', unit: '%', better: 'higher' },
    visual_appeal_score_1: { name: 'Visual appeal rating 1', unit: 'score' }, visual_appeal_score_2: { name: 'Visual appeal rating 2', unit: 'score' }, visual_appeal_score_3: { name: 'Visual appeal rating 3', unit: 'score' }, visual_appeal_score_4: { name: 'Visual appeal rating 4', unit: 'score' }, visual_appeal_score_5: { name: 'Visual appeal rating 5', unit: 'score' },
    prompt_adherance_score_1: { name: 'Prompt adherence rating 1', unit: 'score' }, prompt_adherance_score_2: { name: 'Prompt adherence rating 2', unit: 'score' }, prompt_adherance_score_3: { name: 'Prompt adherence rating 3', unit: 'score' }, prompt_adherance_score_4: { name: 'Prompt adherence rating 4', unit: 'score' }, prompt_adherance_score_5: { name: 'Prompt adherence rating 5', unit: 'score' },
    overall_preference_Low: { name: 'Overall preference low', unit: '%', better: 'higher' }, overall_preference_High: { name: 'Overall preference high', unit: '%', better: 'higher' }, overall_preference_Medium: { name: 'Overall preference medium', unit: '%', better: 'higher' },
  },
  async fetch() {
    type Entry = { label: string; elo_rating: number; average_rank: number; rank1_percentage: number; rank2_percentage: number; trueskill_rating: number;
      detailed_stats: Record<string, Record<string, number>> };
    const data = (await labelboxData(feed, 'image-generation')).info as Entry[];
    if (data.length < 8) throw new Error('Missing image generation models');
    return data.map(r => {
      if (!r.label || ![r.elo_rating, r.trueskill_rating, r.average_rank, r.rank1_percentage, r.rank2_percentage].every(Number.isFinite)) throw new Error('Incomplete image rating');
      const metrics: Record<string, number> = { trueSkill: r.trueskill_rating, averageRank: r.average_rank, first: r.rank1_percentage, second: r.rank2_percentage };
      for (const [category, ratings] of Object.entries(r.detailed_stats)) {
        for (const [key, value] of Object.entries(ratings)) if (Number.isFinite(value)) metrics[category + '_' + key] = value;
      }
      return { model: r.label, score: r.elo_rating, metrics };
    });
  },
};

export default board;
