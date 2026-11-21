// Jam-ALT compares lyric transcriptions by word error rate. MIREX publishes a separate table for each collection and lists the submission details above it.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

export async function lyricsResults(url: string, section: string) {
  const html = await fetchText(url);
  const result = tables(html.split('id="' + section + '"')[1] ?? '')[0];
  const submissions = tables(html).find(t => t[0]?.[0]?.text === 'Team' && t[0][1]?.text === 'PDF');
  if (!result || result[0][2].text !== 'WER' || result.length < 6 || !submissions) throw new Error('Missing MIREX ' + section + ' results');
  return result.slice(1).map(cells => {
    const model = cells[0].text.replace(/\(\d+\)$/, '').trim();
    const meta = submissions.find(r => r[0].text === model);
    const wer = num(cells[2].text);
    if (!meta || wer == null) throw new Error('Incomplete MIREX result: ' + model);
    const metrics: Record<string, number> = {};
    for (let i = 1; i < cells.length; i++) {
      const value = num(cells[i].text);
      if (value != null) metrics[result[0][i].text] = 100 * value;
    }
    const rtf = num(meta[5].text);
    if (rtf != null) metrics.realTimeFactor = rtf;
    const link = meta[1].html.match(/href="([^"]+)"/)?.[1];
    return { model, harness: model, score: 100 * wer, params: num(meta[3].text), link: link ? new URL(link, url).href : undefined, metrics };
  });
}

const feed = "https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results#Jam-ALT";

const board: Leaderboard = {
  benchmark: "jam-alt",
  url: "https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results#Jam-ALT",
  feed,
  terms: "The MIREX wiki lists GNU Free Documentation License 1.2 unless otherwise noted. https://futuremirex.com/mirex/wiki/2026:Lyrics_Transcription_Results The robots.txt URL returns 404.",
  host: 'MIREX',
  fetch: () => lyricsResults(feed, 'Jam-ALT'),
};

export default board;
