// ONESTRUCTION ranks models by their overall construction score. Its HTML table lists each contributing benchmark.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "construction-ai-leaderboard-onestruction",
  url: "https://ai.onestruction.com/leaderboard/en/",
  feed: "https://ai.onestruction.com/leaderboard/en/",
  terms: "ONESTRUCTION claims copyright and gives no explicit license for the rankings. Exclude open model cost estimates derived from Artificial Analysis. https://ai.onestruction.com/leaderboard/en/methodology/ Its robots.txt blocks named crawlers.",
  reference: ["pi"],
  async fetch() {
    const table = tables(await fetchText(this.url)).find(t => t[0]?.[2]?.text === 'Overall');
    if (!table || table.length < 21) throw new Error('Missing construction rankings');
    const parts = table[0].slice(3).map(c => c.text);
    if (!parts.includes('IDS generation') || parts.length < 6) throw new Error('Missing benchmark columns');
    this.parts = Object.fromEntries(parts.map(p => [p,p]));
    return table.slice(1).map(r => {
      const model = r[1].html.match(/class="model-title-name">([^<]+)/)?.[1];
      const href = r[1].html.match(/href="([^"]+)"/)?.[1];
      const score = num(r[2].text);
      if (!model || !href || score === undefined || r.length !== parts.length+3) throw new Error('Incomplete construction ranking');
      const metrics: Record<string,number> = {};
      parts.forEach((part,i) => { const value = num(r[i+3].text); if (value !== undefined) metrics[part] = value; });
      return { model, score, metrics, setting: r[1].text.match(/\( (.+?) \)/)?.[1], open: r[1].text.includes('Open weights'), link: new URL(href,this.url).href, harness: 'pi' };
    });
  },
};
export default board;
