// The source reports no overall score. The headline is the plain mean of the 2 language parts, computed by this importer.
// EntireSongs evaluates long-form song transcription with background music. Table 7 of the Qwen3-ASR report gives WER (%) for English and Chinese songs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.21337';
const names = ['GPT-4o-Transcribe', 'Gemini-2.5-Pro', 'Doubao-ASR-1.0', 'Whisper-large-v3', 'Fun-ASR-MLT-Nano', 'Qwen3-ASR-1.7B'];
const aliases = { 'Qwen3-ASR-1.7B': 'qwen3-asr-1-7b' };
function textOf(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
export default {
  benchmark: 'entiresongs-qwen', url: feed, feed, static: 'paper', terms: 'Paper and license at https://arxiv.org/abs/2601.21337',
  headline: 'The paper reports no overall score, so this is the plain mean of English and Chinese EntireSongs WER.',
  aliases,
  parts: { english: 'EntireSongs-en', chinese: 'EntireSongs-zh' },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await paperHtml(feed);
    const figure = html.split('<figure id="S4.T7"')[1]?.split('</figure>')[0];
    if (!figure) throw new Error('Missing Qwen3-ASR Table 7');
    const row = (id: string) => {
      const start = figure.indexOf('<tr id="' + id + '"');
      if (start < 0) return [];
      const htmlRow = figure.slice(start, figure.indexOf('</tr>', start) + 5);
      return htmlRow.split('<td').slice(1).map(c => textOf('<td ' + c.split('</td>')[0] + '</td>'));
    };
    const english = row('S4.T7.4.1.8');
    const chinese = row('S4.T7.4.1.9');
    const models = names;
    const start = english.indexOf('EntireSongs-en') + 1;
    if (english.length < start + models.length || chinese.length < start + models.length) throw new Error('Incomplete EntireSongs columns');
    const out = models.flatMap((model, i) => {
      const en = Number(english[start + i]), zh = Number(chinese[start + i]);
      if (!Number.isFinite(en) || !Number.isFinite(zh)) return [];
      return [{ model, score: (en + zh) / 2, metrics: { english: en, chinese: zh } }];
    });
    return checked(out, 4);
  },
} satisfies Leaderboard;
