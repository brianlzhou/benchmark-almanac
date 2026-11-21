// MUSEBENCH tests whether detectors distinguish human music from generated music.
// Table 8 gives overall balanced accuracy and false negative rates for ten music generators.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2610.20310";
const header = ["Detector", "ACC_{B}", "Prec.", "Rec.", "FPR", "FNR", "MusicGen", "AudioLDM2", "Riffusion", "MAGNeT", "JASCO", "Stable Audio", "Mustango", "Lyria RT", "Suno", "Udio"];
const columns: Record<string, number> = {"MusicGenFnr": 6, "AudioLDM2Fnr": 7, "RiffusionFnr": 8, "MAGNeTFnr": 9, "JASCOFnr": 10, "StableAudioFnr": 11, "MustangoFnr": 12, "LyriaRTFnr": 13, "SunoFnr": 14, "UdioFnr": 15};
const board: Leaderboard = {
  benchmark: "musebench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2610.20310." ,
  stats: { precision: {name:'Precision',unit:'%',better:'higher'}, recall: {name:'Recall',unit:'%',better:'higher'}, fpr: {name:'False positive rate',unit:'%',better:'lower'}, fnr: {name:'False negative rate',unit:'%',better:'lower'} },
  parts: {"MusicGenFnr": {"name": "MusicGen", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "AudioLDM2Fnr": {"name": "AudioLDM2", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "RiffusionFnr": {"name": "Riffusion", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "MAGNeTFnr": {"name": "MAGNeT", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "JASCOFnr": {"name": "JASCO", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "StableAudioFnr": {"name": "Stable Audio", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "MustangoFnr": {"name": "Mustango", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "LyriaRTFnr": {"name": "Lyria RT", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "SunoFnr": {"name": "Suno", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}, "UdioFnr": {"name": "Udio", "group": "Generator", "note": "False negative rate for this generator.", "better": "lower", "unit": "%"}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row.every(cell => cell === row[0]) && ['Open-source', 'Commercial'].includes(row[0])) continue;
      const model = row[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[1]);
      rows.push({ model, score, setting: 'Default', metrics: { ...metrics, precision: numberCell(row[2]), recall: numberCell(row[3]), fpr: numberCell(row[4]), fnr: numberCell(row[5]) } });
    }
    return checked(rows, 11);
  },
};
export default board;
