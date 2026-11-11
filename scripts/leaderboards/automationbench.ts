// AutomationBench (Zapier). The Framer page renders the top ten configurations in HTML, but its page module
// contains every ranked row behind "See more". Follow the current script_main route to the /benchmarks module
// and read only literal [rank, model, percent, cost] tuples, without evaluating downloaded JavaScript.
// Check the expanded count against the HTML so a changed bundle cannot silently truncate the leaderboard.
// Zapier's terms of service and acceptable use policy set no rule
// against automated reading. The official score is the pass rate on Zapier's held-out private task set.
// The fourth cell, "Cost / task" in US dollars at standard list pricing (an asterisk marks models that also
// have promotional pricing), is the cost.
//
// Names carry the setting in parentheses: "GPT-6 Astra (XHigh)", "Claude Opus 5.5 (default fallbacks,
// Max)". The last part is the effort; anything before it ("default fallbacks") is the harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://zapier.com/benchmarks';
const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'none', 'between tools']);

const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .trim();

const board: Leaderboard = {
  benchmark: 'automationbench',
  url: PAGE,
  feed: `${PAGE} (current Framer page module, all ranked leaderboard rows)`,
  terms: "Static page on zapier.com; Zapier's terms of service and acceptable use policy do not restrict automated reading.",
  aliases: { 'Gemini 3.1 Pro (preview)': 'gemini-3-1-pro' },
  async fetch() {
    const html = await fetchText(PAGE);
    const main = html.match(/<script\b[^>]*src="([^"]*\/script_main\.[^"]+\.mjs)"/)?.[1];
    if (!main) throw new Error('AutomationBench main module missing');
    const routes = await fetchText(main);
    const page = routes.match(/page:[^{}]*?import\(`([^`]+)`\)\),path:`\/benchmarks`/)?.[1];
    if (!page) throw new Error('AutomationBench page route missing');
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const source = await fetchText(new URL(page, main).href);
    const rows: LeaderboardRow[] = [];
    const ranked = [...source.matchAll(/\[(\d+),`([^`]+)`,`([\d.]+%)`,`(\$[\d.]+[\*†‡]?)`\]/g)];
    const more = html.match(/See (\d+) more/);
    const visible = html.split('<div class="abp-row"').slice(1).filter((chunk) => {
      const cells = [...chunk.slice(0, 8000).matchAll(/<span style="font-family[^>]*>([\s\S]*?)<\/span>/g)].map((m) => text(m[1]));
      return /^\d+$/.test(cells[0] ?? '') && /%$/.test(cells[2] ?? '');
    }).length;
    if (ranked.length !== visible + Number(more?.[1] ?? 0)) throw new Error(`AutomationBench count changed: ${ranked.length} module rows versus ${visible} visible plus ${more?.[1] ?? 0}`);
    for (const [index, tuple] of ranked.entries()) {
      const [, rank, rawName, score, price] = tuple;
      const name = rawName.replace(/[†‡§*]+$/, '').trim();
      if (Number(rank) !== index + 1) throw new Error('AutomationBench ranks are not contiguous');
      const paren = name.match(/^(.*?)\s*\(([^)]*)\)$/);
      let model = name;
      let setting: string | undefined;
      let harness: string | undefined;
      if (paren) {
        const parts = paren[2].split(',').map((p) => p.trim());
        const last = parts.at(-1)!.toLowerCase();
        if (EFFORTS.has(last)) {
          model = paren[1];
          setting = last;
          harness = parts.slice(0, -1).join(', ') || undefined;
        }
      }
      const cost = parseFloat(price?.match(/^\$\s*([\d.]+)/)?.[1] ?? '');
      rows.push({ model, score: parseFloat(score), setting, harness, cost: Number.isFinite(cost) && cost > 0 ? cost : undefined });
    }
    if (!rows.length) throw new Error('no leaderboard rows found; the page layout may have changed');
    return rows;
  },
};
export default board;
