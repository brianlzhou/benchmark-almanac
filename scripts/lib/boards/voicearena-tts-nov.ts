// Voice Arena November 2026 TTS language pools (Egyptian Arabic, Filipino-accented English, Gujarati, Tamil, Telugu).
// Read only the public site's anonymous Supabase endpoint. Public launch flag tts_nov_languages_live controls launch status.
// Intervals are 95% confidence bounds reported as Elo +/- ci by Voice Arena.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson } from '../util.ts';

const SITE = 'https://voicearena.com';
const NOV_LANGUAGES = new Set(['Egyptian Arabic', 'Filipino-accented English', 'Gujarati', 'Tamil', 'Telugu']);

interface Entry {
  language: string;
  category: string;
  sub_category: string | null;
  model: string;
  creator_key: string;
  elo: number;
  ci: number;
  samples: number;
  win_rate: number | string;
}

const pause = () => new Promise((r) => setTimeout(r, 1050));
let pending: Promise<{ rows: Entry[]; live: boolean }> | undefined;

async function source() {
  if (pending) return pending;
  pending = (async () => {
    const html = await fetchText(SITE + '/tts-leaderboard/us-english');
    const path = html.match(/src="(\/assets\/index-[^"/]+\.js)"/)?.[1];
    if (!path) throw new Error('Voice Arena main asset missing');
    await pause();
    const main = await fetchText(SITE + path);
    const origin = main.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
    let anon: string | undefined;
    for (const m of main.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      try {
        if (JSON.parse(Buffer.from(m[0].split('.')[1], 'base64url').toString()).role === 'anon') {
          anon = m[0];
          break;
        }
      } catch {}
    }
    if (!origin || !anon) throw new Error('Voice Arena public anonymous configuration missing');
    const headers = { apikey: anon, Authorization: 'Bearer ' + anon };
    const flags = await fetchJson<{ value: unknown }[]>(origin + '/rest/v1/site_settings?select=value&key=eq.tts_nov_languages_live', { headers });
    const rows: Entry[] = [];
    const fields = 'language,category,sub_category,creator_key,model,elo,ci,win_rate,samples';
    for (let offset = 0; ; offset += 1000) {
      await pause();
      const batch = await fetchJson<Entry[]>(
        origin + '/rest/v1/leaderboard_rows?select=' + fields + '&category=eq.All&sub_category=is.null&order=rank.asc&limit=1000&offset=' + offset,
        { headers },
      );
      rows.push(...batch);
      if (batch.length < 1000) break;
    }
    return { rows, live: flags.some((r) => r.value === true) };
  })();
  try {
    return await pending;
  } catch (e) {
    pending = undefined;
    throw e;
  }
}

export function voiceArenaNov(language: string, slug: string): Leaderboard {
  return {
    benchmark: 'voicearena-' + slug,
    url: SITE + '/tts-leaderboard/' + slug,
    feed: SITE + '/tts-leaderboard/' + slug,
    terms: 'Public Voice Arena leaderboard and anonymous read API. Site terms apply. The almanac credits and links the source.',
    stats: {
      votes: { name: 'Votes', unit: 'count' },
      winRate: { name: 'Win rate', unit: '%', better: 'higher' },
    },
    async fetch(): Promise<LeaderboardRow[]> {
      const data = await source();
      if (NOV_LANGUAGES.has(language) && !data.live) throw new Error('Voice Arena language is not publicly launched: ' + language);
      const rows: LeaderboardRow[] = [];
      for (const r of data.rows) {
        if (r.category !== 'All' || r.sub_category !== null) continue;
        if (r.language !== language && !(NOV_LANGUAGES.has(language) && r.language === language + '__hold')) continue;
        if (!r.model || !Number.isFinite(r.elo) || r.samples <= 0) continue;
        const metrics: Record<string, number> = {};
        if (Number.isFinite(r.samples)) metrics.votes = r.samples;
        const wr = Number(r.win_rate);
        if (Number.isFinite(wr)) metrics.winRate = wr;
        const hasCi = Number.isFinite(r.ci) && r.ci >= 0;
        rows.push({
          model: r.model,
          score: r.elo,
          ...(hasCi ? { low: r.elo - r.ci, high: r.elo + r.ci } : {}),
          metrics,
        });
      }
      if (!rows.length) throw new Error('Voice Arena public language ratings missing: ' + language);
      return rows;
    },
  };
}
