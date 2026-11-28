// TTS Spaces Arena live leaderboard via the Hugging Face Space's Gradio get_leaderboard endpoint.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://pendrokar-tts-spaces-arena.hf.space/gradio_api/call/get_leaderboard';
const URL = 'https://huggingface.co/spaces/Pendrokar/TTS-Spaces-Arena';

function cleanModelName(htmlCell: string): string {
  const anchorText = htmlCell.match(/<a[^>]*>([\s\S]*?)<\/a>/i)?.[1];
  const raw = text(anchorText ?? htmlCell);
  return raw
    .replace(/\s*\([^()]*[\p{Extended_Pictographic}][^()]*\)/gu, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D®™]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePercent(htmlCell: string): number | undefined {
  const m = text(htmlCell).match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'tts-spaces-arena',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. The TTS Spaces Arena Space publishes Elo ratings and vote summaries publicly.',
  headline: 'Elo rating from blind pairwise human votes across open and hosted text-to-speech Spaces, excluding preliminary unranked models.',
  stats: {
    winRate: { name: 'Win rate', unit: '%', better: 'higher' },
    votes: { name: 'Votes', unit: 'count', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: [false] }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) throw new Error(`TTS Spaces Arena callback failed: ${res.status}`);
    const { event_id } = (await res.json()) as { event_id?: string };
    if (!event_id || !/^[a-f\d]+$/.test(event_id)) {
      throw new Error('Missing TTS Spaces Arena event id');
    }

    const stream = await fetchText(`${FEED}/${event_id}`);
    const raw = stream.match(/event: complete\r?\ndata: (.+)/)?.[1];
    if (!raw) throw new Error('Incomplete TTS Spaces Arena callback stream');

    const parsed = JSON.parse(raw) as [{ headers?: string[]; data?: (string | number | null)[][] }];
    const table = parsed[0];
    if (!table || !Array.isArray(table.headers) || !Array.isArray(table.data)) {
      throw new Error('Unexpected TTS Spaces Arena dataframe payload');
    }

    const nameIdx = table.headers.indexOf('Name');
    const winIdx = table.headers.indexOf('Win Rate');
    const eloIdx = table.headers.indexOf('Elo');
    const votesIdx = table.headers.indexOf('Votes');
    if (nameIdx < 0 || eloIdx < 0) {
      throw new Error(`Missing expected columns in TTS Spaces Arena headers: ${table.headers.join(', ')}`);
    }

    const rows: LeaderboardRow[] = [];
    for (const r of table.data) {
      const nameHtml = String(r[nameIdx] ?? '');
      const elo = Number(r[eloIdx]);
      if (!nameHtml || !Number.isFinite(elo)) continue;

      const model = cleanModelName(nameHtml);
      if (!model) continue;

      const href = nameHtml.match(/href="([^"]+)"/)?.[1];
      const link = href && /^https?:\/\/\S+$/.test(href) ? href : undefined;
      const open = nameHtml.includes('🔐') ? false : nameHtml.includes('🤗') ? true : undefined;

      const metrics: Record<string, number> = {};
      if (winIdx >= 0 && r[winIdx] != null) {
        const wr = parsePercent(String(r[winIdx]));
        if (wr !== undefined) metrics.winRate = wr;
      }
      if (votesIdx >= 0 && r[votesIdx] != null) {
        const v = Number(r[votesIdx]);
        if (Number.isFinite(v) && v >= 0) metrics.votes = v;
      }

      rows.push({
        model,
        score: elo,
        ...(link ? { link } : {}),
        ...(open !== undefined ? { open } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 30) {
      throw new Error(`Expected at least 30 rows on TTS Spaces Arena, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
