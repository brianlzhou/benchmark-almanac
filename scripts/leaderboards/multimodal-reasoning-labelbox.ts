// Labelbox ranks multimodal reasoning responses using human preferences. Its embedded standings include overall Elo, match counts and category ratings.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const FEED = "https://labelbox.com/leaderboards/multimodal-reasoning/";
interface Entry { label: string; elo: number; total_matches: number; win_rate: number }

const board: Leaderboard = {
  benchmark: "multimodal-reasoning-labelbox",
  url: "https://labelbox.com/leaderboards/multimodal-reasoning/",
  feed: FEED,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots rules exclude CGI and PDF paths.",
  async fetch() {
    const data = await labelboxData(FEED, 'multimodal-reasoning');
    if (data.overall.length < 8 || Object.keys(data.info).length < 4) throw new Error('Missing multimodal standings');
    const parts: Record<string,string> = {};
    const rows = (data.overall as Entry[]).map(r => {
      if (!r.label || !Number.isFinite(r.elo) || !Number.isFinite(r.total_matches)) throw new Error('Missing multimodal result');
      const metrics: Record<string,number> = {};
      for (const [key,value] of Object.entries(r)) if (typeof value === 'number' && key !== 'elo') metrics[key] = value;
      for (const [key,group] of Object.entries(data.info as Record<string,Record<string,Entry>>)) {
        const entry = Object.values(group).find(v => v.label === r.label);
        if (entry && Number.isFinite(entry.elo)) { parts[key] = key; metrics[key] = entry.elo; }
      }
      return { model: r.label, score: r.elo, metrics };
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
