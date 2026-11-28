// Kamai AEC-Geometric-Bench (November 2026 revision) measures object detection, segmentation, and tag reading on architectural PDFs.
// The GitHub README ranks six systems by pooled object F1 across ten classes on 312 sheets, plus per-class F1, a 15-sheet public subset, and door/window tags.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/KamaiEnterprises/aec-geometric-bench/main/README.md';
const CLASS_KEYS: Record<string, string> = {
  'Single Swing Door': 'singleSwingDoor',
  'Double Swing Door': 'doubleSwingDoor',
  'Window': 'window',
  'Sink': 'sink',
  'Toilet': 'toilet',
  'Bathtub': 'bathtub',
  'Shower': 'shower',
  'Cooktops': 'cooktops',
  'Elevator': 'elevator',
  'Stairs': 'stairs',
};
const SETTINGS: Record<string, string> = {
  'GPT-6 Astra': 'agent, high effort',
  'GPT-6.1 Sol': 'agent, high effort',
  'Claude Opus 5.5': 'agent, high effort',
  'Gemini 4 Argon': 'single call, max thinking',
};
const TAG_LABEL: Record<string, string> = {
  'Kamai Nov26': 'Kamai Nov26',
  'GPT-6 Astra': 'GPT-6 Astra, agent',
  'GPT-6.1 Sol': 'GPT-6.1 Sol, agent',
  'Claude Opus 5.5': 'Claude Opus 5.5, agent',
  'Gemini 4 Argon': 'Gemini 4 Argon, one call',
};

const board: Leaderboard = {
  benchmark: 'aec-geometric-bench-nov-2026',
  url: 'https://github.com/KamaiEnterprises/aec-geometric-bench',
  feed: FEED,
  costPer: 'task',
  terms: 'Kamai licenses released drawings and derived dataset files under CC BY-NC 4.0 and the scorer under Apache 2.0. https://github.com/KamaiEnterprises/aec-geometric-bench/blob/main/dataset/LICENSE-DATA.md',
  parts: {
    wall: { name: 'Wall pixel F1', group: 'Geometry' },
    area: { name: 'Area pixel F1', group: 'Geometry' },
    instance: { name: 'Area instance F1', group: 'Geometry' },
    singleSwingDoor: { name: 'Single swing door F1', group: 'Object class' },
    doubleSwingDoor: { name: 'Double swing door F1', group: 'Object class' },
    window: { name: 'Window F1', group: 'Object class' },
    sink: { name: 'Sink F1', group: 'Object class' },
    toilet: { name: 'Toilet F1', group: 'Object class' },
    bathtub: { name: 'Bathtub F1', group: 'Object class' },
    shower: { name: 'Shower F1', group: 'Object class' },
    cooktops: { name: 'Cooktops F1', group: 'Object class' },
    elevator: { name: 'Elevator F1', group: 'Object class' },
    stairs: { name: 'Stairs F1', group: 'Object class' },
    releasedF1: { name: 'Object F1 on 15 released sheets', group: 'Released 15 sheets' },
    releasedWall: { name: 'Wall pixel F1 on 15 released sheets', group: 'Released 15 sheets' },
    releasedArea: { name: 'Area pixel F1 on 15 released sheets', group: 'Released 15 sheets' },
    releasedInstance: { name: 'Area instance F1 on 15 released sheets', group: 'Released 15 sheets' },
    tagsF1: { name: 'Door and window tags F1', group: 'Tags benchmark' },
  },
  stats: {
    precision: { name: 'Precision', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    recall: { name: 'Recall', unit: 'score', better: 'higher', note: 'Stored from 0 to 1.' },
    releasedPrecision: { name: 'Released-sheet precision', unit: 'score', better: 'higher', note: 'Precision on 15 released sheets, stored from 0 to 1.' },
    releasedRecall: { name: 'Released-sheet recall', unit: 'score', better: 'higher', note: 'Recall on 15 released sheets, stored from 0 to 1.' },
    latency: { name: 'Median time per sheet', unit: 'seconds', better: 'lower' },
  },
  chart: {
    title: 'Object F1 vs. price per sheet',
    x: { key: 'cost', label: 'Price per sheet', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Object F1', better: 'higher' },
    note: 'Object F1 against mean token price per sheet on a log scale across all 312 sheets, matching the README scatter plot.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = markdownTables(await fetchText(FEED));
    const prefix = 'system|P|R|F1|wall px|area px|area inst';
    const matching = tables.filter(t => t[0]?.slice(0, 7).join('|') === prefix && t.length >= 7);
    const full = matching.find(t => t[0][7]?.includes('median'));
    const released = matching.find(t => t[0][7]?.includes('range'));
    const byClass = tables.find(t => t[0]?.[0] === 'class' && t[0]?.[1] === 'annotated');
    const tags = tables.find(t => t[0]?.join('|') === 'system|correct|wrong|extra|missed|P|R|F1');
    if (!full || !released || !byClass || !tags) throw new Error('Missing AEC November 2026 tables');

    return full.slice(1).map(([model, ...cells]) => {
      const subset = released.slice(1).find(r => r[0] === model);
      if (!subset) throw new Error('Missing released-sheet scores for ' + model);
      const values = [...cells.slice(0, 6), ...subset.slice(1, 7)];
      if (values.length !== 12 || values.some(v => !v || !Number.isFinite(Number(v)))) {
        throw new Error('Invalid AEC score for ' + model);
      }
      const [precision, recall, score, wall, area, instance, releasedPrecision, releasedRecall, releasedF1, releasedWall, releasedArea, releasedInstance] = values.map(Number);
      const metrics: Record<string, number> = {
        precision, recall, wall, area, instance,
        releasedPrecision, releasedRecall, releasedF1, releasedWall, releasedArea, releasedInstance,
      };
      const minutes = cells[6]?.trim();
      if (minutes && /^\d+(?:\.\d+)?$/.test(minutes)) metrics.latency = Number(minutes) * 60;
      const price = cells[7]?.trim().match(/^\$(\d+(?:\.\d+)?)$/)?.[1];

      const colIdx = byClass[0].indexOf(model);
      if (colIdx < 0) throw new Error('Missing per-class column for ' + model);
      for (const row of byClass.slice(1)) {
        const key = CLASS_KEYS[row[0]];
        if (!key) throw new Error('Unknown AEC object class: ' + row[0]);
        const cell = row[colIdx]?.trim();
        if (cell && /^\d+(?:\.\d+)?$/.test(cell)) metrics[key] = Number(cell);
      }

      const tagName = TAG_LABEL[model];
      if (tagName) {
        const tagRow = tags.slice(1).find(r => r[0] === tagName);
        if (!tagRow || !Number.isFinite(Number(tagRow[7]))) throw new Error('Missing tag score for ' + model);
        metrics.tagsF1 = Number(tagRow[7]);
      }

      return {
        model,
        ...(SETTINGS[model] ? { setting: SETTINGS[model] } : {}),
        score,
        ...(price ? { cost: Number(price) } : {}),
        metrics,
      };
    });
  },
};
export default board;
