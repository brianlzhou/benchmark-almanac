// Dynamic-SUPERB Phase-2 evaluates spoken language models zero-shot across 180+ tasks spanning audio and
// speech understanding, classification, regression and sequence generation.
// The official leaderboard CSV mixes incompatible metrics (LLM-C percentage, WER, NAR, Sacre BLEU, MSE,
// IoU and correlation scores) and publishes no single overall column across all tasks.
// This importer reads data.csv from the official DynamicSuperb/leaderboard Hugging Face Space, setting the
// headline score to the plain unweighted mean of all 129 LLM-C percentage tasks (all 10 models have 100%
// coverage), and storing Audio and Speech LLM-C averages, all 15 LLM-C taxonomy breakdowns, mean WER
// across 17 WER tasks, mean NAR across 18 NAR tasks and mean Sacre BLEU across 2 translation tasks in
// metrics and parts.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://huggingface.co/spaces/DynamicSuperb/leaderboard/raw/main/data.csv';

const SUBTAX_MAP: Record<string, { key: string; part: BoardPart }> = {
  'Audio/Harmony & Pitch': { key: 'audioHarmonyPitch', part: { name: 'Harmony and Pitch', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Music Classification': { key: 'audioMusicClassification', part: { name: 'Music Classification', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Safety': { key: 'audioSafety', part: { name: 'Audio Safety', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Signal Characteristics Analysis': { key: 'audioSignalCharacteristics', part: { name: 'Signal Characteristics Analysis', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Singing Analysis': { key: 'audioSingingAnalysis', part: { name: 'Singing Analysis', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Sound Event': { key: 'audioSoundEvent', part: { name: 'Sound Event', group: 'Audio (LLM-C)', unit: '%' } },
  'Audio/Spatial Audio': { key: 'audioSpatialAudio', part: { name: 'Spatial Audio', group: 'Audio (LLM-C)', unit: '%' } },
  'Speech/Paralinguistics': { key: 'speechParalinguistics', part: { name: 'Paralinguistics', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Phonetics, Phonology, Prosody': { key: 'speechPhoneticsProsody', part: { name: 'Phonetics, Phonology, Prosody', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Safety & Security': { key: 'speechSafetySecurity', part: { name: 'Safety and Security', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Speaker & Language': { key: 'speechSpeakerLanguage', part: { name: 'Speaker and Language', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Speech Enhancement': { key: 'speechEnhancement', part: { name: 'Speech Enhancement', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Speech Recognition': { key: 'speechRecognition', part: { name: 'Speech Recognition', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Speech, Voice, Hearing Disorder': { key: 'speechDisorder', part: { name: 'Speech, Voice, Hearing Disorder', group: 'Speech (LLM-C)', unit: '%' } },
  'Speech/Spoken Language Understanding': { key: 'speechSpokenLanguageUnderstanding', part: { name: 'Spoken Language Understanding', group: 'Speech (LLM-C)', unit: '%' } },
};

const PARTS: Record<string, BoardPart> = {
  audioLlmc: { name: 'Audio overall (LLM-C)', group: 'Domain (LLM-C)', unit: '%' },
  speechLlmc: { name: 'Speech overall (LLM-C)', group: 'Domain (LLM-C)', unit: '%' },
  ...Object.fromEntries(Object.values(SUBTAX_MAP).map(({ key, part }) => [key, part])),
  wer: { name: 'WER tasks', group: 'Other metrics', unit: '%', better: 'lower', note: 'Mean word error rate across 17 WER tasks.' },
  nar: { name: 'NAR tasks', group: 'Other metrics', unit: '%', better: 'lower', note: 'Mean non-answer rate across 18 NAR tasks.' },
  sacreBleu: { name: 'Sacre BLEU tasks', group: 'Other metrics', unit: 'score', better: 'higher', note: 'Mean Sacre BLEU across 2 translation tasks.' },
};

const parseVal = (cell: string, expectPct: boolean, label: string): number => {
  const s = cell.trim();
  if (expectPct) {
    if (!/^-?\d+(?:\.\d+)?%$/.test(s)) throw new Error(`Dynamic-SUPERB expected percentage for ${label}: "${cell}"`);
    return Number(s.slice(0, -1));
  }
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) throw new Error(`Dynamic-SUPERB expected number for ${label}: "${cell}"`);
  return Number(s);
};

const mean = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;

const board: Leaderboard = {
  benchmark: 'dynamic-superb-phase-2',
  url: 'https://huggingface.co/spaces/DynamicSuperb/leaderboard',
  feed: FEED,
  terms: 'The Dynamic-SUPERB team publishes the leaderboard CSV at https://huggingface.co/spaces/DynamicSuperb/leaderboard and the benchmark repository under the MIT license at https://github.com/dynamic-superb/dynamic-superb.',
  headline: 'Dynamic-SUPERB Phase-2 mixes incompatible metrics across its tasks, so this is the plain mean of its 129 LLM-C percentage tasks.',
  parts: PARTS,
  async fetch(): Promise<LeaderboardRow[]> {
    const csvRows = parseCsv(await fetchText(FEED));
    if (csvRows.length < 180) throw new Error(`Dynamic-SUPERB expected at least 180 task rows, got ${csvRows.length}`);
    const metaCols = new Set(['Task Name', 'Metric', 'HigherBetter', 'Taxonomy']);
    const modelNames = Object.keys(csvRows[0]).filter((k) => !metaCols.has(k));
    if (modelNames.length < 5) throw new Error('Dynamic-SUPERB model columns missing');

    const llmcRows = csvRows.filter((r) => r.Metric === 'LLM-C' && r.HigherBetter === 'TRUE');
    const werRows = csvRows.filter((r) => r.Metric === 'WER');
    const narRows = csvRows.filter((r) => r.Metric === 'NAR');
    const bleuRows = csvRows.filter((r) => r.Metric === 'Sacre Bleu');
    if (llmcRows.length < 100 || werRows.length < 10 || narRows.length < 10) {
      throw new Error('Dynamic-SUPERB task breakdown counts changed');
    }

    const rows: LeaderboardRow[] = [];
    for (const model of modelNames) {
      const llmcVals: number[] = [];
      const audioVals: number[] = [];
      const speechVals: number[] = [];
      const bySubTax = new Map<string, number[]>();

      for (const r of llmcRows) {
        const v = parseVal(r[model] ?? '', true, `${model} ${r['Task Name']}`);
        llmcVals.push(v);
        const segs = (r.Taxonomy ?? '').split('/');
        if (segs[0] === 'Audio') audioVals.push(v);
        else if (segs[0] === 'Speech') speechVals.push(v);
        const subKey = SUBTAX_MAP[`${segs[0]}/${segs[1]}`]?.key;
        if (subKey) {
          const list = bySubTax.get(subKey) ?? [];
          list.push(v);
          bySubTax.set(subKey, list);
        }
      }

      const metrics: Record<string, number> = {
        audioLlmc: mean(audioVals),
        speechLlmc: mean(speechVals),
      };
      for (const [k, vals] of bySubTax) metrics[k] = mean(vals);
      metrics.wer = mean(werRows.map((r) => parseVal(r[model] ?? '', true, `${model} ${r['Task Name']}`)));
      metrics.nar = mean(narRows.map((r) => parseVal(r[model] ?? '', true, `${model} ${r['Task Name']}`)));
      if (bleuRows.length) {
        metrics.sacreBleu = mean(bleuRows.map((r) => parseVal(r[model] ?? '', false, `${model} ${r['Task Name']}`)));
      }

      rows.push({
        model,
        score: mean(llmcVals),
        metrics,
      });
    }

    return checked(rows, 10);
  },
};

export default board;
