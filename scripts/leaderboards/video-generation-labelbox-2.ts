// Labelbox compares generated videos using human preferences. Its leaderboard payload publishes Elo, TrueSkill, ranking shares and the distributions of human rating scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/video-generation/";

const board: Leaderboard = {
  stats: { trueSkill: { name: 'TrueSkill rating', unit: 'rating', better: 'higher' }, averageRank: { name: 'Average rank', unit: 'rating', better: 'lower' }, first: { name: 'First-place rate', unit: '%', better: 'higher' }, second: { name: 'Second-place rate', unit: '%', better: 'higher' }, consistency_with_prompt_High: { name: 'Consistency with prompt, high', unit: '%', better: 'higher' }, consistency_with_prompt_Low: { name: 'Consistency with prompt, low', unit: '%', better: 'higher' }, consistency_with_prompt_Medium: { name: 'Consistency with prompt, medium', unit: '%', better: 'higher' }, artifacts_and_errors_High: { name: 'Artifacts and errors, high', unit: '%', better: 'lower' }, artifacts_and_errors_Low: { name: 'Artifacts and errors, low', unit: '%', better: 'lower' }, artifacts_and_errors_Medium: { name: 'Artifacts and errors, medium', unit: '%', better: 'lower' }, is_realistic_High: { name: 'Realism, high', unit: '%', better: 'higher' }, is_realistic_Medium: { name: 'Realism, medium', unit: '%', better: 'higher' }, is_realistic_Low: { name: 'Realism, low', unit: '%', better: 'higher' }, video_resolution_High: { name: 'Video resolution, high', unit: '%', better: 'higher' }, video_resolution_Medium: { name: 'Video resolution, medium', unit: '%', better: 'higher' }, video_resolution_Low: { name: 'Video resolution, low', unit: '%', better: 'higher' } },
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
