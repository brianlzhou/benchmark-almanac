// NepTTS-Bench rates the quality of synthesized Nepali speech. The repository reproduces the paper's human mean opinion scores.
// The ratings count and 95% rater-cluster bootstrap intervals accompany each score. The paper identifies the synthesis models in its configuration table.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/Ampixa/neptts-bench/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'neptts-bench', static: 'paper', url: 'https://github.com/Ampixa/neptts-bench', feed,
  terms: 'MIT covers the software. Source-specific terms cover other materials: https://github.com/Ampixa/neptts-bench#license.',
  aliases: { 'gemini-2.5-flash-preview-tts': 'gemini-2-5-flash-tts' },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0]?.join('|') === 'System|Human MOS|95% CI|Ratings');
    if (!table) throw new Error('Missing native-listener MOS table');
    return checked(table.slice(1).filter(([name]) => !['Natural speech','Human (read)'].includes(name)).map(([name,mean,ci,n]) => {
      const interval = ci.match(/^\[([\d.]+),\s*([\d.]+)\]$/);
      if (!interval || !/^\d+$/.test(n)) throw new Error('Missing MOS interval or rating count');
      let model = name;
      let setting: string | undefined;
      if (name === 'Gemini Flash' || name === 'Gemini (Hindi)') {
        model = 'gemini-2.5-flash-preview-tts';
        setting = name === 'Gemini Flash' ? 'Kore, explicit Nepali prompt' : 'Kore, raw Devanagari';
      } else if (name === 'ElevenLabs v3') {
        model = 'eleven_multilingual_v2';
        setting = 'Sarah';
      }
      return {model, setting, score: numberCell(mean), low: numberCell(interval[1]), high: numberCell(interval[2]), metrics: { ratings: Number(n) }};
    }), 10);
  },
};
export default board;
