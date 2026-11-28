// Open Universal Arabic ASR Leaderboard (Elm Research Center): evaluates open and commercial
// speech recognition models across 6 Arabic test splits (SADA, Common Voice, MASC Clean,
// MASC Noisy, MGB-2, Casablanca) on Word Error Rate (WER, %, lower is better) and Character
// Error Rate (CER, %, lower is better). Reads the inline Python `results = {...}` dict from app.py.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED =
  'https://huggingface.co/spaces/elmresearchcenter/open_universal_arabic_asr_leaderboard/raw/main/app.py';

function parseResultsDict(py: string): Record<string, (string | number | null)[]> {
  const start = py.indexOf('results = {');
  if (start < 0) throw new Error('Arabic ASR: results dict not found in app.py');
  const braceStart = py.indexOf('{', start);
  let depth = 0;
  let inStr: string | null = null;
  let escaped = false;
  let end = -1;
  for (let i = braceStart; i < py.length; i++) {
    const ch = py[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '#') {
      while (i < py.length && py[i] !== '\n') i++;
      continue;
    }
    if (ch === '"' || ch === "'") inStr = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('Arabic ASR: unterminated results dict in app.py');
  const raw = py.slice(braceStart, end);
  // Strip Python line comments outside strings, convert None -> null, strip trailing commas.
  let out = '';
  inStr = null;
  escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '#') {
      while (i < raw.length && raw[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (ch === '"' || ch === "'") inStr = ch;
    out += ch;
  }
  const jsonish = out
    .replace(/\bNone\b/g, 'null')
    .replace(/,(\s*[\]}])/g, '$1');
  return JSON.parse(jsonish) as Record<string, (string | number | null)[]>;
}

const board: Leaderboard = {
  benchmark: 'open-universal-arabic-asr-leaderboard',
  url: 'https://huggingface.co/spaces/elmresearchcenter/open_universal_arabic_asr_leaderboard',
  feed: FEED,
  terms: 'Public research Hugging Face Space leaderboard published by Elm Research Center.',
  parts: {
    sada: { name: 'SADA', unit: '%', better: 'lower' },
    commonVoice: { name: 'Common Voice', unit: '%', better: 'lower' },
    mascClean: { name: 'MASC Clean', unit: '%', better: 'lower' },
    mascNoisy: { name: 'MASC Noisy', unit: '%', better: 'lower' },
    mgb2: { name: 'MGB-2', unit: '%', better: 'lower' },
    casablanca: { name: 'Casablanca', unit: '%', better: 'lower' },
  },
  stats: {
    avgCer: { name: 'Average CER', unit: '%', better: 'lower', note: 'Average character error rate across all six Arabic datasets.' },
    sadaCer: { name: 'SADA CER', unit: '%', better: 'lower' },
    commonVoiceCer: { name: 'Common Voice CER', unit: '%', better: 'lower' },
    mascCleanCer: { name: 'MASC Clean CER', unit: '%', better: 'lower' },
    mascNoisyCer: { name: 'MASC Noisy CER', unit: '%', better: 'lower' },
    mgb2Cer: { name: 'MGB-2 CER', unit: '%', better: 'lower' },
    casablancaCer: { name: 'Casablanca CER', unit: '%', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const py = await fetchText(FEED);
    const dict = parseResultsDict(py);
    const models = dict['Model'] ?? [];
    const avgWer = dict['Average WER⬇️'] ?? [];
    const colMap: readonly [string, string][] = [
      ['SADA WER', 'sada'],
      ['Common Voice\nWER', 'commonVoice'],
      ['MASC(clean-test)\nWER', 'mascClean'],
      ['MASC(noisy-test)\nWER', 'mascNoisy'],
      ['MGB-2 WER', 'mgb2'],
      ['Casablanca\nWER', 'casablanca'],
      ['Average CER', 'avgCer'],
      ['SADA CER', 'sadaCer'],
      ['Common Voice\nCER', 'commonVoiceCer'],
      ['MASC(clean-test)\nCER', 'mascCleanCer'],
      ['MASC(noisy-test)\nCER', 'mascNoisyCer'],
      ['MGB-2 CER', 'mgb2Cer'],
      ['Casablanca\nCER', 'casablancaCer'],
    ];

    const rows: LeaderboardRow[] = [];
    for (let i = 0; i < models.length; i++) {
      const rawName = String(models[i] ?? '').trim();
      const score = Number(avgWer[i]);
      if (!rawName || !Number.isFinite(score)) continue;
      let model = rawName;
      let setting: string | undefined;
      const paren = rawName.match(/^(.+?)\s+\((lm|greedy)\)$/i);
      if (paren) {
        model = paren[1].trim();
        setting = paren[2].toLowerCase();
      }
      const metrics: Record<string, number> = {};
      for (const [srcKey, dstKey] of colMap) {
        const v = dict[srcKey]?.[i];
        if (typeof v === 'number' && Number.isFinite(v)) metrics[dstKey] = v;
      }
      const link = model.includes('/') && !/\s/.test(model) ? `https://huggingface.co/${model}` : undefined;
      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(link ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
