// Open TTS Leaderboard 1.7 release series (pinned to 24-11-2026, v1.7.3, which adds models under the 1.7.0 protocol).
// Uses the Space's public Gradio refresh callback over all 36 languages and 5 datasets, with and without voice cloning.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = 'https://hf-audio-open-tts-leaderboard.hf.space/gradio_api/call/_refresh_leaderboard';
const URL = 'https://huggingface.co/spaces/hf-audio/open_tts_leaderboard';
const VERSION = '24-11-2026';

const LANGUAGE_SPECS: readonly [flag: string, name: string, metric: 'WER' | 'CER', key: string][] = [
  ['🇬🇧', 'English', 'WER', 'englishWer'],
  ['🇨🇳', 'Chinese', 'CER', 'chineseCer'],
  ['🇫🇷', 'French', 'WER', 'frenchWer'],
  ['🇪🇸', 'Spanish', 'WER', 'spanishWer'],
  ['🇩🇪', 'German', 'WER', 'germanWer'],
  ['🇮🇹', 'Italian', 'WER', 'italianWer'],
  ['🇯🇵', 'Japanese', 'CER', 'japaneseCer'],
  ['🇰🇷', 'Korean', 'CER', 'koreanCer'],
  ['🇷🇺', 'Russian', 'WER', 'russianWer'],
  ['🇭🇰', 'Cantonese', 'CER', 'cantoneseCer'],
  ['🇵🇹', 'Portuguese', 'WER', 'portugueseWer'],
  ['🇳🇱', 'Dutch', 'WER', 'dutchWer'],
  ['🇵🇱', 'Polish', 'WER', 'polishWer'],
  ['🇨🇿', 'Czech', 'WER', 'czechWer'],
  ['🇷🇴', 'Romanian', 'WER', 'romanianWer'],
  ['🇬🇷', 'Greek', 'WER', 'greekWer'],
  ['🇫🇮', 'Finnish', 'WER', 'finnishWer'],
  ['🇹🇷', 'Turkish', 'WER', 'turkishWer'],
  ['🇸🇦', 'Arabic', 'WER', 'arabicWer'],
  ['🇮🇳', 'Hindi', 'WER', 'hindiWer'],
  ['🇮🇩', 'Indonesian', 'WER', 'indonesianWer'],
  ['🇹🇭', 'Thai', 'CER', 'thaiCer'],
  ['🇻🇳', 'Vietnamese', 'WER', 'vietnameseWer'],
  ['🇮🇷', 'Persian', 'CER', 'persianCer'],
  ['🇺🇦', 'Ukrainian', 'WER', 'ukrainianWer'],
  ['🇸🇪', 'Swedish', 'WER', 'swedishWer'],
  ['🇩🇰', 'Danish', 'WER', 'danishWer'],
  ['🇳🇴', 'Norwegian', 'WER', 'norwegianWer'],
  ['🇵🇭', 'Filipino', 'WER', 'filipinoWer'],
  ['🇲🇾', 'Malay', 'WER', 'malayWer'],
  ['🇭🇺', 'Hungarian', 'WER', 'hungarianWer'],
  ['🇮🇱', 'Hebrew', 'WER', 'hebrewWer'],
  ['🇧🇬', 'Bulgarian', 'WER', 'bulgarianWer'],
  ['🇭🇷', 'Croatian', 'WER', 'croatianWer'],
  ['🇸🇰', 'Slovak', 'WER', 'slovakWer'],
  ['🇦🇩', 'Catalan', 'WER', 'catalanWer'],
];

const LANGUAGES = LANGUAGE_SPECS.map(([flag, name]) => `${flag} ${name}`);
const DATASETS = ['Seed-TTS', 'CV3-Eval', 'MiniMax', 'Neyshekar', 'ZTTS2-Mini-clean'];

const HEADER_TO_PART: Record<string, string> = Object.fromEntries(
  LANGUAGE_SPECS.map(([flag, , metric, key]) => [`${flag} ${metric}`, key]),
);

const PARTS: Record<string, string> = Object.fromEntries(
  LANGUAGE_SPECS.map(([, name, metric, key]) => [key, `${name} ${metric}`]),
);

const STAT_HEADERS: Record<string, string> = {
  'Average RTFx ⬆️': 'averageRtfx',
  'Average SIM ⬆️': 'averageSim',
  'UTMOS (en) ⬆️': 'utmosEn',
  'KOMOS (ko) ⬆️': 'komosKo',
};

const board: Leaderboard = {
  benchmark: 'open-tts-leaderboard-1-7',
  url: URL,
  feed: FEED,
  terms: 'Hugging Face allows crawling. The Space and source datasets retain their respective licenses.',
  headline: 'Average transcription error rate across 36 languages and five datasets (including ZTTS2-Eval Mini clean), with per-utterance error capped at 100% before pooling.',
  parts: PARTS,
  stats: {
    averageRtfx: { name: 'Average real-time factor', unit: 'speedup', better: 'higher' },
    averageSim: { name: 'Average speaker similarity', unit: 'score', better: 'higher' },
    utmosEn: { name: 'UTMOS (English)', unit: 'score', better: 'higher' },
    komosKo: { name: 'KOMOS (Korean)', unit: 'score', better: 'higher' },
    languagesScored: { name: 'Languages scored', unit: 'count', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = [];
    for (const clone of [false, true]) {
      if (rows.length) await new Promise((resolve) => setTimeout(resolve, 1100));
      const res = await fetch(FEED, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          data: [VERSION, '', 35.3, 46, LANGUAGES, DATASETS, clone, []],
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`Open TTS 1.7 callback failed: ${res.status}`);
      const { event_id } = (await res.json()) as { event_id?: string };
      if (!event_id || !/^[a-f\d]+$/.test(event_id)) {
        throw new Error('Missing Open TTS 1.7 event id');
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const stream = await fetchText(`${FEED}/${event_id}`);
      const raw = stream.match(/event: complete\r?\ndata: (.+)/)?.[1];
      if (!raw) {
        throw new Error('Incomplete Open TTS 1.7 callback stream');
      }
      const valid = raw.replace(/"(?:\\.|[^"\\])*"|\bNaN\b/g, (tok) => (tok === 'NaN' ? 'null' : tok));
      const parsed = JSON.parse(valid) as [{ value: { headers: string[]; data: (number | string | null)[][] } }];
      const table = parsed[0]?.value;
      if (!table || !Array.isArray(table.headers) || !Array.isArray(table.data)) {
        throw new Error('Unexpected Open TTS 1.7 table payload');
      }

      const col = (label: string): number => {
        const idx = table.headers.indexOf(label);
        if (idx < 0) throw new Error(`Missing Open TTS 1.7 column ${label}`);
        return idx;
      };
      const scoreIdx = table.headers.indexOf('Average ER ⬇️') >= 0 ? col('Average ER ⬇️') : col('Average WER ⬇️');
      const modelIdx = col('Model');
      const sizeIdx = col('Size (B)');
      const licenseIdx = col('License');
      const coverageIdx = col('Coverage');

      for (const r of table.data) {
        const score = r[scoreIdx];
        const rawModel = r[modelIdx];
        if (typeof score !== 'number' || !Number.isFinite(score) || !rawModel) continue;

        const metrics: Record<string, number> = {};
        table.headers.forEach((h, i) => {
          const val = r[i];
          if (typeof val !== 'number' || !Number.isFinite(val)) return;
          const partKey = HEADER_TO_PART[h];
          if (partKey) {
            metrics[partKey] = val;
            return;
          }
          const statKey = STAT_HEADERS[h];
          if (statKey) {
            metrics[statKey] = val;
          }
        });

        const coverageVal = Number.parseInt(String(r[coverageIdx] ?? ''), 10);
        if (Number.isFinite(coverageVal) && coverageVal > 0) {
          metrics.languagesScored = coverageVal;
        }

        const modelHtml = String(rawModel);
        const model = text(modelHtml).replace(/\s+NEW(?=\s*[¹²³⁴⁵⁶⁷⁸⁹⁰]*$)/, '').trim();
        if (!model) continue;

        const href = modelHtml.match(/href="([^"]+)"/)?.[1];
        const link = href && /^https?:\/\/\S+$/.test(href) ? href : undefined;
        const size = r[sizeIdx];
        const params = typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : undefined;
        const license = text(String(r[licenseIdx] ?? '')).trim() || undefined;

        rows.push({
          model,
          score,
          setting: clone ? 'Voice cloning' : 'Without voice cloning',
          ...(link ? { link } : {}),
          ...(params !== undefined ? { params } : {}),
          ...(license ? { license } : {}),
          ...(Object.keys(metrics).length ? { metrics } : {}),
        });
      }
    }

    if (rows.length < 70) {
      throw new Error(`Expected at least 70 rows on Open TTS Leaderboard 1.7, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
