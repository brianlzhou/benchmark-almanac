// Labelbox scores complex reasoning across multiple domains. Its embedded page data publish overall accuracy and domain scores.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const FEED = "https://labelbox.com/leaderboards/complex-reasoning/";
interface Score { label: string; overall_score: number; elo: number }

const board: Leaderboard = {
  benchmark: "complex-reasoning-labelbox",
  url: "https://labelbox.com/leaderboards/complex-reasoning/",
  feed: FEED,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots rules exclude CGI and PDF paths.",
  async fetch() {
    const data = await labelboxData(FEED, 'complex-reasoning');
    if (data.overall.length < 14 || !data.info.aggregate_performance) throw new Error('Missing Labelbox reasoning results');
    const parts: Record<string, string> = {};
    const rows = (data.overall as Score[]).map(r => {
      const metrics: Record<string, number> = {};
      for (const key of data.order as string[]) {
        const entry = (Object.values(data.info[key]) as Score[]).find(v => v.label === r.label);
        if (key !== 'aggregate_performance' && entry && Number.isFinite(entry.overall_score)) {
          parts[key] = key.replaceAll('_',' '); metrics[key] = entry.overall_score;
        }
      }
      if (!r.label || !Number.isFinite(r.overall_score) || r.elo !== r.overall_score) throw new Error('Invalid Labelbox score');
      return { model: r.label, score: r.overall_score, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
