// DCASE ranks synthesized sound scenes by a weighted average of listener ratings. The official
// results page supplies the perceptual scores for each sound class and the separate FAD measures.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
const feed = "https://dcase.community/challenge2024/task-sound-scene-synthesis-results";
const board: Leaderboard = {
  benchmark: 'dcase-sound-scene-synthesis-2024',
  url: "https://dcase.community/challenge2024/task-sound-scene-synthesis-results",
  feed,
  terms: "DCASE robots.txt allows the results page and restricts image and theme paths. The page gives no separate score reuse license.",
  parts: {
    '1_0': { name: 'Foreground Fit average score', group: 'Foreground Fit' },
    '2_0': { name: 'Background Fit average score', group: 'Background Fit' },
    '3_0': { name: 'Audio Quality average score', group: 'Audio Quality' },
  },
  stats: {
    'evaluationFAD (PANNs)': { name: 'Evaluation Fréchet Audio Distance with PANNs', unit: 'score', better: 'lower' },
    'evaluationFAD (CLAP)': { name: 'Evaluation Fréchet Audio Distance with CLAP', unit: 'score', better: 'lower' },
    'evaluationFAD (VGGish)': { name: 'Evaluation Fréchet Audio Distance with VGGish', unit: 'score', better: 'lower' },
    'developmentFAD (PANNs)': { name: 'Development Fréchet Audio Distance with PANNs', unit: 'score', better: 'lower' },
    'developmentFAD (CLAP)': { name: 'Development Fréchet Audio Distance with CLAP', unit: 'score', better: 'lower' },
    'developmentFAD (VGGish)': { name: 'Development Fréchet Audio Distance with VGGish', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const all = tables(await fetchText(feed));
    const scores = all.find(t => t[0].some(c => c.text === 'Weighted Average Score'));
    const fad = all.find(t => t[1]?.some(c => c.text === 'FAD Rank'));
    if (!scores || !fad || scores[1][3]?.text !== 'Average Score') throw new Error('Missing DCASE score columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of scores.slice(2)) {
      const model = cells[1].text;
      if (model === 'Sound Designer (Ref.)') continue;
      const score = Number(cells[4].text);
      if (!model || !cells[4].text || !Number.isFinite(score)) throw new Error('Missing DCASE rating');
      const metrics: Record<string, number> = {};
      for (let group = 0; group < 4; group++) {
        const groupName = scores[0][group + 2].text;
        for (let column = group === 0 ? 1 : 0; column < 7; column++) {
          const index = 4 + group * 7 + column;
          const name = scores[1][index - 1].text, key = group + '_' + column;
          if (!cells[index]?.text || !Number.isFinite(Number(cells[index].text))) throw new Error('Missing DCASE perceptual metric');
          metrics[key] = Number(cells[index].text);
          if (column) (board.parts ??= {})[key] = { name, group: groupName };
        }
      }
      const other = fad.slice(2).find(r => r[1].text === model);
      if (!other) throw new Error('Missing DCASE FAD row');
      for (let i = 5; i <= 10; i++) {
        if (other[i]?.text && Number.isFinite(Number(other[i].text))) metrics[(i < 8 ? 'evaluation' : 'development') + fad[1][i - 1].text] = Number(other[i].text);
      }
      rows.push({ model, score, metrics, link: feed + "#collapse-" + cells[2].text });
    }
    if (rows.length < 5) throw new Error('Incomplete DCASE leaderboard');
    return rows;
  },
};
export default board;
