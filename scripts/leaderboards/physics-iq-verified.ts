// Physics-IQ Verified. physics-iq-verified.anates.ai is server-rendered with its main leaderboard as an
// HTML table: per video model the net improvement over the track mean in percentage points (with its
// uncertainty; the board's ranking and headline), whether an LLM rewrote the prompts, the prompt source
// (the benchmark's own prompts, "BPP", or custom prompts), output FPS and a normalized cost per video. The
// net improvement (pp, can be negative) is the score; a custom prompt source is passed as the setting so a
// model run both ways keeps two rows. The normalized cost per video is passed as the cost. The score's "±"
// uncertainty is kept as metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const PAGE = 'https://physics-iq-verified.anates.ai/';

const board: Leaderboard = {
  benchmark: 'physics-iq-verified',
  url: PAGE,
  feed: `${PAGE} (server-rendered leaderboard table, net improvement vs track mean, pp)`,
  terms: 'Public leaderboard page; the robots.txt (Cloudflare content signals only) sets no rules and the site states no terms.',
  aliases: {
    // the board links this entry to bfl.ai/models/flux-3-video
    'FLUX 3 [large]': 'flux-3-video',
    'Seedance 2.5': 'dreamina-seedance-2-5',
  },
  async fetch() {
    const t = tables(await fetchText(PAGE)).find((rows) => rows[0]?.some((c) => /NET IMPROVEMENT/i.test(c.text)));
    if (!t) throw new Error('leaderboard table not found');
    const head = t[0].map((c) => c.text.toUpperCase());
    const iModel = head.indexOf('MODEL');
    const iScore = head.findIndex((h) => /NET IMPROVEMENT/.test(h));
    const iPrompt = head.indexOf('PROMPT SOURCE');
    const iCost = head.findIndex((h) => h.startsWith('COST'));
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const name = r[iModel]?.html.match(/class="model-name">([\s\S]*?)<\/span>/)?.[1];
      // the score cell holds the improvement and its uncertainty: the first number is the improvement
      const score = num(r[iScore]?.html.match(/class="preview-score-number">([\s\S]*?)<small/)?.[1]);
      if (!name || score === undefined) continue;
      const half = num(r[iScore]?.html.match(/class="preview-score-uncertainty">([\s\S]*?)<\/span>/)?.[1].replace(/<!--[\s\S]*?-->/g, ''));
      const prompt = iPrompt >= 0 ? r[iPrompt]?.text : undefined;
      // "MiniMax H3 Max" is a product tier, not a reasoning effort: keep the host in the name so the
      // resolver does not read "Max" as a setting of MiniMax H3
      const host = text(r[iModel]?.html.match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? '').split('·')[0].trim();
      const model = / Max$/.test(text(name)) && host ? `${text(name)} (${host})` : text(name);
      rows.push({
        model,
        score,
        setting: prompt && /custom/i.test(prompt) ? 'custom prompts' : undefined,
        cost: iCost >= 0 ? num(r[iCost]?.text) : undefined,
        ...(half !== undefined && half > 0 ? { metrics: { ciLow: score - half, ciHigh: score + half } } : {}),
      });
    }
    return rows;
  },
};
export default board;
