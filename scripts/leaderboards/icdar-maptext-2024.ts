// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// MapText tests historical map text detection, recognition and linking on Rumsey and IGN maps.
// The organizers archive each submission by ID. Task 4 ranks by character-weighted quality, labeled Quality on the board.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://zenodo.org/records/11549943/files/evaluations.tar.bz2?download=1';
const tasks = ['Word Detection', 'Phrase Detection', 'Word Detection and Recognition', 'Phrase Detection and Recognition'];
const datasets = ['Rumsey (General)', 'IGN (French)'];
const methods = [
  { model: 'MapText Strong Pipeline', submitter: 'Bilibili Inc.', ids: [114579, 114581, 114582, 114585] },
  { model: 'Baseline TESTR Checkpoint', submitter: 'Organizers', ids: [113478, 113480, 113479, 113481] },
];
const parts = Object.fromEntries(tasks.flatMap((task, t) => datasets.map((dataset, f) => ['t' + (t + 1) + 'f' + (f + 1), task + ': ' + dataset])));
const submetrics: [string, string][] = [
  ['quality', 'quality'],
  ['fscore', 'F-score'],
  ['precision', 'precision'],
  ['recall', 'recall'],
  ['tightness', 'tightness'],
];
const task4Submetrics: [string, string][] = [
  ...submetrics,
  ['char_accuracy', 'character accuracy'],
  ['char_quality', 'character quality'],
];
const stats = Object.fromEntries(tasks.flatMap((task, t) => datasets.flatMap((dataset, f) =>
  (t === 3 ? task4Submetrics : submetrics).map(([key, label]) => [
    `t${t + 1}f${f + 1}_${key}`,
    { name: `${task} (${dataset}) ${label}`, unit: '%' as const, better: 'higher' as const },
  ]),
)));
const board: Leaderboard = {
  benchmark: 'icdar-maptext-2024', url: 'https://rrc.cvc.uab.es/?ch=28&com=evaluation', feed, parts, stats,
  terms: 'The organizers release their evaluation archive under CC BY 4.0. https://zenodo.org/records/11549943',
  async fetch() {
    const archive = Buffer.from(await fetchBytes(feed));
    return checked(methods.map(({ model, submitter, ids }) => {
      const metrics: Record<string, number> = {};
      let sum = 0;
      ids.forEach((id, t) => datasets.forEach((_, f) => {
        const path = 'ch28/t' + (t + 1) + '/f' + (f + 1) + '/' + id + '.json';
        const content = execFileSync('tar', ['-xjOf', '-', path], { input: archive, encoding: 'utf8', maxBuffer: 10_000_000 });
        const { results } = JSON.parse(content);
        const prefix = 't' + (t + 1) + 'f' + (f + 1);
        for (const key of ['quality', 'fscore', 'precision', 'recall', 'tightness', ...(t === 3 ? ['char_accuracy', 'char_quality'] : [])]) {
          if (typeof results[key] !== 'number' || !Number.isFinite(results[key])) throw new Error('Invalid ' + key + ' in ' + path);
          metrics[prefix + '_' + key] = results[key] * 100;
        }
        metrics[prefix] = metrics[prefix + (t === 3 ? '_char_quality' : '_quality')];
        sum += metrics[prefix];
      }));
      return { model, submitter, score: sum / 8, metrics };
    }), 2);
  },
};
export default board;
