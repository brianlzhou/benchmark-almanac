// EmotionTalk evaluates emotion recognition, sentiment analysis and captioning with different measures.
// The headline is the published Mean from the first task, Unimodal Emotion Recognition.
// The README reports separate speech, text and visual models on four labeling conditions each.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/flageval-baai/EmotionTalk/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'emotiontalk', url: 'https://github.com/flageval-baai/EmotionTalk#-experiments', feed,
  terms: 'CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  headline: 'Published mean on Unimodal Emotion Recognition for the specified input modality.',
  async fetch() {
    const section = (await fetchText(feed)).split('Unimodal Emotion Recognition Results')[1]?.split('Multimodal Emotion Recognition Results')[0];
    if (!section) throw new Error('Missing unimodal recognition results');
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, string> = {};
    for (const modality of ['Speech', 'Text', 'Visual']) {
      const block = section.match(new RegExp('\\|\\s*Model\\s*\\|\\s*' + modality + '\\(Four\\)[^\\n]*(?:\\n\\|[^\\n]*)+'));
      if (!block) throw new Error('Missing ' + modality + ' table');
      const lines = block[0].split('\n');
      const cells = (line: string) => line.trim().slice(1, -1).split('|').map(v => v.replaceAll('**', '').trim());
      const columns = cells(lines[0]);
      const labels = [modality + '(Four)', 'Multi(Four)', modality + '(All)', 'Multi(All)'];
      if (columns.join('|') !== ['Model', ...labels, 'Mean'].join('|')) throw new Error('Changed conditions');
      for (const line of lines.slice(2)) {
        const [model, ...raw] = cells(line);
        const values = raw.map(Number);
        if (values.length !== 5 || raw.some(v => !v) || !values.every(Number.isFinite)) throw new Error('Invalid condition score');
        const metrics: Record<string, number> = {};
        labels.forEach((label, i) => { const key = label.replace(/[()]/g, ''); parts[key] = label; metrics[key] = values[i]; });
        rows.push({ model, setting: modality, score: values[4], metrics });
      }
    }
    board.parts = parts;
    return checked(rows, 26);
  },
};
export default board;
