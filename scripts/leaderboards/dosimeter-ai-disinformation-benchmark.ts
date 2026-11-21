// Dosimeter ranks assistants by the percentage of responses flagged in its pooled world results.
// The page includes the two country panels and underlying counts in the HTML for each row.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import type { LeaderboardRow } from './types.ts';
import { text } from '../lib/html.ts';

const feed = "https://dosimeteraudit.org/benchmark";
const board: Leaderboard = {
  stats: { officialSources: { name: 'Official sources', unit: 'count' }, flagged: { name: 'Flagged claims', unit: 'count', better: 'lower' }, responses: { name: 'Responses', unit: 'count' }, unitedStatesOfficialSources: { name: 'United States official sources', unit: 'count' }, germanyOfficialSources: { name: 'Germany official sources', unit: 'count' } },
  benchmark: 'dosimeter-ai-disinformation-benchmark',
  url: "https://dosimeteraudit.org/benchmark",
  feed,
  terms: "Dosimeter allows this path in robots.txt. Dosimeter licenses its data under CC BY 4.0. External reports contribute published counts under their own terms. https://github.com/gurovdigital/ai-disinformation-benchmark",
  parts: { germany: 'Germany', unitedStates: 'United States' },
  async fetch() {
    const page = await fetchText(feed);
    const rows = new Map<string, LeaderboardRow>();
    for (const [panel, key] of [['world', 'world'], ['germany', 'germany'], ['united-states', 'unitedStates']]) {
      const section = page.split('data-panel="' + panel + '"')[1]?.split('</ol>')[0];
      if (!section) throw new Error('Missing Dosimeter panel ' + panel);
      for (const match of section.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/g)) {
        const attr = (name: string) => match[1].match(new RegExp('data-' + name + '="([^"]*)"'))?.[1];
        const model = attr('assistant');
        if (model === 'All assistants') continue;
        const score = match[2].match(/class="bm-pct">([\d.]+)%/);
        const official = match[2].match(/class="bm-grayval">([\d.]+)%/);
        if (!model || !score || !official) throw new Error('Incomplete Dosimeter row');
        if (key === 'world') {
          const parts = JSON.parse(text(attr('parts') ?? '')) as {x: number; n: number}[];
          if (!parts.length || !parts.every(p => Number.isFinite(p.x) && Number.isFinite(p.n))) throw new Error('Missing response counts');
          rows.set(model, { model, score: Number(score[1]), link: new URL(attr('assistant-url')!, feed).href,
            metrics: { officialSources: Number(official[1]), flagged: parts.reduce((s,p) => s+p.x, 0), responses: parts.reduce((s,p) => s+p.n, 0) } });
        } else {
          const row = rows.get(model);
          if (row) { row.metrics![key] = Number(score[1]); row.metrics![key + 'OfficialSources'] = Number(official[1]); }
        }
      }
    }
    if (rows.size < 10) throw new Error('Missing world rankings');
    return [...rows.values()];
  },
};
export default board;
