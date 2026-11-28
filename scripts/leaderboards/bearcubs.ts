// BEARCUBS (UMass Amherst): live web-browsing benchmark for computer-use and search agents.
// Reads the static HTML leaderboard table at https://bear-cubs.github.io/, filtering out the Human row.
import type { Leaderboard, LeaderboardRow } from './types.ts';

const PAGE = 'https://bear-cubs.github.io/';

const clean = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pct = (s: string) => Number(s.replace(/%/g, '').trim());

function parseModelSetting(raw: string): { model: string; setting?: string } {
  const zero = raw.match(/^(.+?)\s+zero-shot$/i);
  if (zero) return { model: zero[1].trim(), setting: 'zero-shot' };
  const gs = raw.match(/^(.+?)\s*\+\s*Google Search$/i);
  if (gs) return { model: gs[1].trim(), setting: 'Google Search' };
  return { model: raw.trim() };
}

const board: Leaderboard = {
  benchmark: 'bearcubs',
  url: PAGE,
  feed: PAGE,
  terms: 'Public leaderboard table published on GitHub Pages by the BEARCUBS authors.',
  aliases: {
    'Perplexity sonar-pro': 'sonar-pro',
  },
  parts: {
    textOnly: { name: 'Text only', group: 'Modality' },
    multimodal: { name: 'Multimodal', group: 'Modality' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(PAGE, { headers: { 'User-Agent': 'benchmark-almanac/1.0' } });
    if (!res.ok) throw new Error(`BEARCUBS page: ${res.status}`);
    const html = await res.text();
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) throw new Error('BEARCUBS: leaderboard table not found');

    const rows: LeaderboardRow[] = [];
    for (const tr of tableMatch[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => clean(c[1]));
      if (cells.length < 5) continue;
      const [category, rawModel, allStr, textStr, mmStr] = cells;
      if (/^category$/i.test(category) || /^human$/i.test(category) || /^human$/i.test(rawModel)) continue;
      const score = pct(allStr);
      if (!Number.isFinite(score)) continue;

      const parsed = parseModelSetting(rawModel);
      // Prevent "Google Deep Research" from colliding with OpenAI's `deep-research` when vendor prefix is stripped.
      const model = /^Google Deep Research$/i.test(parsed.model) ? 'Gemini Deep Research' : parsed.model;
      const metrics: Record<string, number> = {};
      const tVal = pct(textStr);
      const mVal = pct(mmStr);
      if (Number.isFinite(tVal)) metrics.textOnly = tVal;
      if (Number.isFinite(mVal)) metrics.multimodal = mVal;

      const row: LeaderboardRow = { model, score, metrics };
      if (parsed.setting) row.setting = parsed.setting;
      rows.push(row);
    }
    if (rows.length === 0) throw new Error('BEARCUBS: parsed zero rows');
    return rows;
  },
};

export default board;
