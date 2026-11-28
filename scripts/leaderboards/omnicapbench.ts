// OmniCapBench — Tencent Hunyuan, NTU, and Northumbria University audio-visual captioning benchmark.
// Reads Table 2 (Rule-based structural, 13 metrics) and Table 3 (Localized semantic, 9 metrics) from
// https://01yzzyu.github.io/OmniCapBench/ covering 9 omnimodal models (6 proprietary, 3 open-source).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://01yzzyu.github.io/OmniCapBench/';

const board: Leaderboard = {
  benchmark: 'omnicapbench',
  feed: FEED,
  url: FEED,
  terms: 'Public project leaderboard published by Tencent Hunyuan, NTU, and Northumbria University.',
  aliases: {
    'MiMo-2.5': 'mimo-v2-5',
    'Qwen3-Omni-Instruct': 'qwen3-omni-30b-a3b',
  },
  headline: 'EVSA F1 measuring audio-visual event-to-shot association. Twelve additional structural metrics and localized semantic metrics are recorded as stats.',
  stats: {
    sgc: { name: 'SGC', unit: '%', better: 'higher' },
    refUse: { name: 'RefUse', unit: '%', better: 'higher' },
    ccc: { name: 'CCC', unit: '%', better: 'higher' },
    refSubjF1: { name: 'Ref subject F1', unit: '%', better: 'higher' },
    refSceneF1: { name: 'Ref scene F1', unit: '%', better: 'higher' },
    shotF1: { name: 'Shot F1', unit: '%', better: 'higher' },
    shotTIoU: { name: 'Shot tIoU', unit: '%', better: 'higher' },
    subshotF1: { name: 'Subshot F1', unit: '%', better: 'higher' },
    subshotTIoU: { name: 'Subshot tIoU', unit: '%', better: 'higher' },
    eventF1: { name: 'Event F1', unit: '%', better: 'higher' },
    eventTIoU: { name: 'Event tIoU', unit: '%', better: 'higher' },
    speakerF1: { name: 'Speaker F1', unit: '%', better: 'higher' },
    semShot: { name: 'Semantic shot', unit: '%', better: 'higher' },
    semSubjRecall: { name: 'Subject recall', unit: '%', better: 'higher' },
    semSubjPrec: { name: 'Subject precision', unit: '%', better: 'higher' },
    semSceneRecall: { name: 'Scene recall', unit: '%', better: 'higher' },
    semScenePrec: { name: 'Scene precision', unit: '%', better: 'higher' },
    semSubshotRecall: { name: 'Subshot recall', unit: '%', better: 'higher' },
    semSubshotPrec: { name: 'Subshot precision', unit: '%', better: 'higher' },
    semNonDialogue: { name: 'Non-dialogue semantic', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const allTables = tables(html);

    const structTbl = allTables.find(
      (t) =>
        t.length >= 10 &&
        t[0].some((c) => /^SGC$/i.test(c.text)) &&
        t.some((r) => r.some((c) => /EVSA/i.test(c.text))),
    );
    if (!structTbl) throw new Error('OmniCapBench structural table not found');

    const semTbl = allTables.find(
      (t) =>
        t.length >= 10 &&
        t.some((r) => r.some((c) => /Non-\s*dialogue/i.test(c.text))) &&
        t.some((r) => r.some((c) => /^Recall$/i.test(c.text))),
    );

    const semByModel = new Map<string, Record<string, number>>();
    if (semTbl) {
      for (const r of semTbl) {
        if (r.length < 10) continue;
        const m = r[0].text.trim();
        const semShot = num(r[1].text);
        if (!m || semShot === undefined) continue;
        const vals: Record<string, number> = { semShot };
        const pairs: [string, number][] = [
          ['semSubjRecall', 2],
          ['semSubjPrec', 3],
          ['semSceneRecall', 4],
          ['semScenePrec', 5],
          ['semSubshotRecall', 6],
          ['semSubshotPrec', 7],
          ['semNonDialogue', 9],
        ];
        for (const [k, idx] of pairs) {
          const v = num(r[idx].text);
          if (v !== undefined) vals[k] = v;
        }
        semByModel.set(m, vals);
      }
    }

    const rows: LeaderboardRow[] = [];
    let isOpen: boolean | undefined;
    for (const r of structTbl) {
      if (r.length === 1) {
        const heading = r[0].text.trim();
        if (/Proprietary/i.test(heading)) isOpen = false;
        else if (/Open-source/i.test(heading)) isOpen = true;
        continue;
      }
      if (r.length < 14) continue;
      const model = r[0].text.trim();
      const score = num(r[13].text);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = {};
      const cols: [string, number][] = [
        ['sgc', 1],
        ['refUse', 2],
        ['ccc', 3],
        ['refSubjF1', 4],
        ['refSceneF1', 5],
        ['shotF1', 6],
        ['shotTIoU', 7],
        ['subshotF1', 8],
        ['subshotTIoU', 9],
        ['eventF1', 10],
        ['eventTIoU', 11],
        ['speakerF1', 12],
      ];
      for (const [k, idx] of cols) {
        const v = num(r[idx].text);
        if (v !== undefined) metrics[k] = v;
      }
      const sem = semByModel.get(model);
      if (sem) Object.assign(metrics, sem);

      const row: LeaderboardRow = { model, score, metrics };
      if (isOpen !== undefined) row.open = isOpen;
      rows.push(row);
    }

    if (rows.length < 8) throw new Error(`OmniCapBench parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
