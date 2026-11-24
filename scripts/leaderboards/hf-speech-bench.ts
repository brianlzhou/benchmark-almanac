// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Hugging Face Speech Bench (huggingface/hf-speech-bench).
// The Space reads Hugging Face Hub models tagged hf-asr-leaderboard and extracts WER/CER from each model
// card's model-index, letting readers filter by language and dataset without computing a cross-dataset score.
// This importer queries the same Hub API tag filter across all pages and scores models that report both
// test-clean and test-other WER on librispeech_asr (the Space's first recommended dataset), taking the plain
// unweighted mean of the two splits as headline WER (%) and keeping additional reported datasets in parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://huggingface.co/api/models?filter=hf-asr-leaderboard&cardData=true&limit=1000';
const UA = 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)';

interface HfMetric {
  type?: string;
  value?: number | string | number[];
}
interface HfResult {
  dataset?: { type?: string; config?: string; split?: string; args?: { language?: string } };
  metrics?: HfMetric[];
}
interface HfModel {
  id: string;
  createdAt?: string;
  cardData?: {
    license?: string | string[];
    'model-index'?: { results?: HfResult[] }[];
  };
}

function parseWer(raw: number | string | number[] | undefined): number | undefined {
  let v: number;
  if (typeof raw === 'number') v = raw;
  else if (typeof raw === 'string') v = Number.parseFloat(raw.replace(/%/g, '').trim());
  else if (Array.isArray(raw) && raw.length) v = Number(raw[0]);
  else return undefined;
  if (!Number.isFinite(v) || v <= 0) return undefined;
  // Matches app.py parse_metric_value: values under 1.1 are treated as 0-to-1 fractions.
  if (v < 1.1) v *= 100;
  if (v > 200) return undefined;
  return Math.round(v * 100) / 100;
}

const board: Leaderboard = {
  benchmark: 'hf-speech-bench',
  url: 'https://huggingface.co/spaces/huggingface/hf-speech-bench',
  feed: FEED,
  terms: 'Public Hugging Face Hub model-card evaluation metadata tagged hf-asr-leaderboard under Hugging Face Terms of Service.',
  headline: 'The Space filters by language and dataset with no overall score, so this is the plain mean of LibriSpeech test-clean and test-other WER on its first recommended dataset.',
  parts: {
    clean: { name: 'LibriSpeech test-clean', group: 'LibriSpeech' },
    other: { name: 'LibriSpeech test-other', group: 'LibriSpeech' },
    cv11: { name: 'Common Voice 11.0 English', group: 'Other datasets' },
    cv8: { name: 'Common Voice 8.0 English', group: 'Other datasets' },
    mls: { name: 'Multilingual LibriSpeech English', group: 'Other datasets' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const models: HfModel[] = [];
    let nextUrl: string | undefined = FEED;
    for (let page = 0; page < 10 && nextUrl; page++) {
      const res: Response = await fetch(nextUrl, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`${res.status} ${nextUrl}`);
      const batch = (await res.json()) as HfModel[];
      if (!Array.isArray(batch)) throw new Error('Unexpected Hugging Face Hub response');
      models.push(...batch);
      const link: string = res.headers.get('link') ?? '';
      nextUrl = link.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    }
    if (models.length < 100) throw new Error('Too few hf-asr-leaderboard models returned');

    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const results = m.cardData?.['model-index']?.[0]?.results;
      if (!Array.isArray(results)) continue;
      let clean: number | undefined;
      let other: number | undefined;
      let cv11: number | undefined;
      let cv8: number | undefined;
      let mls: number | undefined;

      for (const r of results) {
        const ds = r.dataset?.type;
        if (!ds) continue;
        const cfg = (r.dataset?.config ?? '').toLowerCase();
        const split = (r.dataset?.split ?? '').toLowerCase();
        const lang = (r.dataset?.args?.language ?? '').toLowerCase();
        const werVals = (r.metrics ?? [])
          .filter((x) => (x.type ?? '').toLowerCase().trim() === 'wer')
          .map((x) => parseWer(x.value))
          .filter((v): v is number => v !== undefined);
        if (!werVals.length) continue;
        // Mirrors app.py: keep the lowest WER when multiple decoding variants exist on one split.
        const best = Math.min(...werVals);

        if (ds === 'librispeech_asr') {
          if (cfg === 'clean' || (!cfg && split.includes('clean'))) clean = clean === undefined ? best : Math.min(clean, best);
          else if (cfg === 'other' || (!cfg && split.includes('other'))) other = other === undefined ? best : Math.min(other, best);
        } else if (ds === 'mozilla-foundation/common_voice_11_0' && (cfg === 'en' || lang === 'en')) {
          cv11 = cv11 === undefined ? best : Math.min(cv11, best);
        } else if (ds === 'mozilla-foundation/common_voice_8_0' && (cfg === 'en' || lang === 'en')) {
          cv8 = cv8 === undefined ? best : Math.min(cv8, best);
        } else if (ds === 'facebook/multilingual_librispeech' && (cfg === 'english' || cfg === 'en' || lang === 'en')) {
          mls = mls === undefined ? best : Math.min(mls, best);
        }
      }

      if (clean === undefined || other === undefined) continue;
      const metrics: Record<string, number> = { clean, other };
      if (cv11 !== undefined) metrics.cv11 = cv11;
      if (cv8 !== undefined) metrics.cv8 = cv8;
      if (mls !== undefined) metrics.mls = mls;

      const rawLic = m.cardData?.license;
      const license = Array.isArray(rawLic) ? rawLic[0] : rawLic;
      rows.push({
        model: m.id,
        score: (clean + other) / 2,
        date: m.createdAt?.slice(0, 10),
        open: true,
        license: typeof license === 'string' && license.trim() ? license.trim() : undefined,
        link: `https://huggingface.co/${m.id}`,
        metrics,
      });
    }
    return checked(rows, 50);
  },
};

export default board;
