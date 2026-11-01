// VoiceBench (CUHK-Shenzhen). matthewcym.github.io/VoiceBench/ is a static page with one leaderboard table;
// each row carries data-overall (the Overall score, 0 to 100, the ranking) and data-arch (Audio-LLM, Omni,
// Cascaded, Vision+Audio+LLM, S2S / Full-Duplex). Overall is the score. Cascaded pipelines ("Whisper-v3-large
// + GPT-4o") join a speech recognizer to a text model, so there is no one model to credit and they are
// skipped. A trailing "(thinking)" becomes the setting through the shared resolver.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://matthewcym.github.io/VoiceBench/';

const board: Leaderboard = {
  benchmark: 'voicebench',
  url: PAGE,
  feed: `${PAGE} (static HTML table, data-overall)`,
  terms: 'Static GitHub Pages site that states no terms; the VoiceBench repository is Apache-2.0.',
  aliases: {
    'NVIDIA Nemotron 3 Nano Omni 30B A3B': 'nemotron-3-nano-omni-30b-a3b',
    'Qwen3-Omni-30B-A3B-Thinking': 'qwen3-omni-30b-a3b',
    'Qwen3-Omni-30B-A3B-Instruct': 'qwen3-omni-30b-a3b',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const table = html.match(/<table\b[\s\S]*?<\/table>/)?.[0];
    if (!table) throw new Error('no leaderboard table on the VoiceBench page');
    const rows: LeaderboardRow[] = [];
    for (const m of table.matchAll(/<tr\b([^>]*\bdata-overall="([\d.]+)"[^>]*)>([\s\S]*?)<\/tr>/g)) {
      const arch = m[1].match(/data-arch="([^"]+)"/)?.[1];
      const name = m[3].match(/class="model-name"[^>]*>([\s\S]*?)<\/a>/)?.[1];
      if (!name || arch === 'cascaded' || /\s\+\s/.test(text(name))) continue;
      const model = text(name);
      // the Qwen3-Omni Thinking and Instruct releases share one registry record
      const mode = model.match(/^Qwen3-Omni-.*-(Thinking|Instruct)$/)?.[1];
      rows.push({ model, score: Number(m[2]), setting: mode ? (mode === 'Thinking' ? 'thinking' : 'non-thinking') : undefined });
    }
    if (!rows.length) throw new Error('no rows in the VoiceBench table');
    return rows;
  },
};
export default board;
