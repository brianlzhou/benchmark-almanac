// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// X-Stance evaluates stance detection on political questions. Tables 3 to 5 give macro-F1 for supervised,
// cross-lingual, cross-question and cross-topic evaluation. The authors use harmonic means for German and French.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://ceur-ws.org/Vol-2624/paper9.pdf';
const mainKeys = ['supervised', 'crossLingual', 'crossQuestion', 'crossTopic'] as const;
const parts = {
  supervised: 'Supervised',
  crossLingual: 'Cross-Lingual',
  crossQuestion: 'Cross-Question',
  crossTopic: 'Cross-Topic',
  supervisedDE: { name: 'Supervised German', group: 'Language split' },
  supervisedFR: { name: 'Supervised French', group: 'Language split' },
  crossQuestionDE: { name: 'Cross-Question German', group: 'Language split' },
  crossQuestionFR: { name: 'Cross-Question French', group: 'Language split' },
  crossTopicDE: { name: 'Cross-Topic German', group: 'Language split' },
  crossTopicFR: { name: 'Cross-Topic French', group: 'Language split' },
};
const board: Leaderboard = {
  benchmark: 'x-stance', static: 'paper', feed, url: feed,
  terms: 'The paper uses CC BY 4.0. https://creativecommons.org/licenses/by/4.0/',
  headline: 'The paper reports no overall score, so this is the plain mean of its four macro-F1 scores.',
  parts,
  async fetch() {
    const paper = await pdfText(feed);
    const language = paper.match(/DE\s+FR\s+IT([\s\S]*?)Table 3: Baseline scores/)?.[1];
    const target = paper.match(/Intra-target\s+Cross-question\s+Cross-topic([\s\S]*?)Table 4: Baseline scores/)?.[1];
    const ablations = paper.match(/Supervised\s+Cross-Lingual\s+Cross-Question\s+Cross-Topic([\s\S]*?)Table 5: Results for additional experiments/)?.[1];
    if (!language || !target || !ablations || !/DE\s+FR\s+Mean/.test(target)) throw new Error('Missing X-Stance results');
    const rows: LeaderboardRow[] = [];
    const keys = mainKeys;
    function add(model: string, values: number[], setting?: string, extra = {}) {
      if (values.length !== 4 || !values.every(Number.isFinite)) throw new Error('Missing test partitions for ' + model);
      const metrics = { ...extra, ...Object.fromEntries(keys.map((k, i) => [k, values[i]])) };
      rows.push({ model, setting, score: values.reduce((sum, v) => sum + v, 0) / 4, metrics });
    }
    for (const label of ['fastText', 'M-B ERT']) {
      const numbers = (section: string) => section.split('\n').reverse().find(l => l.trimStart().startsWith(label + '  '))?.match(/\d+\.\d+/g)?.map(Number);
      const lang = numbers(language), split = numbers(target);
      if (lang?.length !== 3 || split?.length !== 9) throw new Error('Missing language scores for ' + label);
      add(label.replace('B ERT', 'BERT'), [split[2], lang[2], split[5], split[8]], undefined, {
        supervisedDE: split[0], supervisedFR: split[1], crossQuestionDE: split[3], crossQuestionFR: split[4], crossTopicDE: split[6], crossTopicFR: split[7] });
    }
    for (const line of ablations.split('\n')) {
      const match = line.trim().match(/^— with (.+?)\s{2,}([\d.\s]+)$/);
      if (match) add('M-BERT', match[2].trim().split(/\s+/).map(Number), 'With ' + match[1]);
    }
    return checked(rows, 8);
  },
};
export default board;
