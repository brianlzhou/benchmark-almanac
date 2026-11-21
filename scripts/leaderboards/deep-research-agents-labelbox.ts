// Labelbox compares research agents on doctoral-level questions. Its composite score combines the domain results.
// The page embeds both the composite and the separate domain tables in its leaderboard payload.
import type { Leaderboard } from './types.ts';
import { labelboxData } from './echochain-labelbox.ts';

const feed = "https://labelbox.com/leaderboards/deep-research-agents/";
interface Entry { label: string; overall_score: number }
const domains = { stem: 'STEM', 'humanities_&_arts': 'Humanities & Arts', 'economics,_policts_and_global_affairs': 'Economics, Politics and Global Affairs' };

const board: Leaderboard = {
  benchmark: "deep-research-agents-labelbox",
  url: "https://labelbox.com/leaderboards/deep-research-agents/",
  feed,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots.txt restrictions apply to CGI and PDF paths.",
  parts: domains,
  async fetch() {
    const data = await labelboxData(feed,'deep-research-agents');
    const groups = data.info as Record<string,Record<string,Entry>>;
    const rows = Object.entries(groups.composite).map(([id,row]) => {
      const metrics: Record<string,number> = {};
      for (const key of Object.keys(domains)) {
        const result = groups[key]?.[id];
        if (!result || !Number.isFinite(result.overall_score)) throw new Error('Missing domain for ' + id);
        metrics[key] = result.overall_score;
      }
      if (!row.label || !Number.isFinite(row.overall_score)) throw new Error('Invalid composite');
      return { model:row.label.trim(), score:row.overall_score, metrics };
    });
    if (rows.length < 3) throw new Error('Expected three research agents');
    return rows;
  },
};
export default board;
