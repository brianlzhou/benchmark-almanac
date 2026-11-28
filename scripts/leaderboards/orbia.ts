// Orbia (worldbench): evaluates generative video world models on 3D world consistency across six
// dimensions (Control, Quality, Input preservation, Persistence, 3D consistency, and Stability).
// Reads the live HTML leaderboard table on https://orbia-bench.github.io.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://orbia-bench.github.io';

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const board: Leaderboard = {
  benchmark: 'orbia',
  url: SITE,
  feed: SITE,
  terms: 'Public research benchmark website published by the Orbia authors.',
  parts: {
    control: { name: 'Control', unit: 'score', better: 'higher' },
    quality: { name: 'Quality', unit: 'score', better: 'higher' },
    inputPreservation: { name: 'Input preservation', unit: 'score', better: 'higher' },
    persistence: { name: 'Persistence', unit: 'score', better: 'higher' },
    consistency3d: { name: '3D consistency', unit: 'score', better: 'higher' },
    stability: { name: 'Stability', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const table = html.match(/<table[\s\S]*?<\/table>/i)?.[0];
    if (!table) throw new Error('Orbia: leaderboard table not found');
    const rowMatches = [...table.matchAll(/<tr[^>]*class="[^"]*lb-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi)];
    const partKeys = ['control', 'quality', 'inputPreservation', 'persistence', 'consistency3d', 'stability'] as const;
    const rows: LeaderboardRow[] = [];

    for (const rm of rowMatches) {
      const tr = rm[1];
      const thHtml = tr.match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? '';
      const spanHtml = thHtml.match(/<span>([\s\S]*?)<\/span>/i)?.[1] ?? thHtml;
      const setting = strip(spanHtml.match(/<small[^>]*>([\s\S]*?)<\/small>/i)?.[1] ?? '') || undefined;
      const model = strip(spanHtml.replace(/<small[^>]*>[\s\S]*?<\/small>/gi, ''));
      const hrefRaw = thHtml.match(/<a[^>]*class="[^"]*lb-link[^"]*"[^>]*href="([^"]+)"/i)?.[1]?.replace(/&amp;/g, '&');
      const link = hrefRaw && /^https?:\/\/\S+$/.test(hrefRaw) ? hrefRaw : undefined;

      const tdVals = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => Number(strip(m[1])));
      if (!model || tdVals.length < 7 || !Number.isFinite(tdVals[0])) continue;

      const metrics: Record<string, number> = {};
      for (let i = 0; i < partKeys.length; i++) {
        const v = tdVals[i + 1];
        if (Number.isFinite(v)) metrics[partKeys[i]] = v;
      }

      rows.push({
        model,
        score: tdVals[0],
        ...(setting ? { setting } : {}),
        ...(link ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
