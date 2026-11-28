// Voice Arena Speech-to-Text V2 leaderboards (US English, Brazilian Portuguese, Romanian, Indian English, Hindi).
// Reads the public CSV files served directly from voicearena.com/data/stt-v2/, mirroring the site's public visibility
// filter and canonical model labels from its STT leaderboard module.
// Headline score is corpus-level Semantic WER (%) on the held-out Private set (or orthography-insensitive OI-WER for Hindi).
// Intervals (low, high) are 95% bootstrap confidence intervals (2.5th to 97.5th percentile over 2,000 resamples) reported by Voice Arena.
import type { BoardPart, BoardStat, Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';

const SITE = 'https://voicearena.com';

const HIDDEN_NON_HINDI = new Set([
  'google::gemini 3.1 pro',
  'google::gemini 3.5 flash',
  'assemblyai::universal-3.5 pro',
  'openai::whisper large v3 turbo',
  'openai::gpt-4o transcribe',
  'openai::gpt-4o-transcribe',
  'sarvam::audio',
  'sarvam::saarika 2.5',
  'sarvam::saaras v4',
  'meta::meta (private)',
  'meta::omniasr ctc 1b v2',
  'meta::omniasr ctc 7b v2',
  'meta::omniasr llm 1b v2',
  'meta::omniasr llm 7b v2',
  'meta::omniasr-llm-7',
  'microsoft (azure ai)::azure llm',
  'gradium::gradium speech-to-text',
  'gradium::gradium stt',
]);

const NVIDIA_RENAMES: Record<string, string> = {
  'nvidia::nemotron 3.5 asr': 'Nemotron 3.5 Transcribe',
  'nvidia::nemotron': 'Nemotron 3.5 Transcribe',
  'nvidia::nvidia nemotron': 'Nemotron 3.5 Transcribe',
  'nvidia::nvidia nemotron 3.5 asr': 'Nemotron 3.5 Transcribe',
};

const MODEL_RENAMES: Record<string, string> = {
  'resonant-1': 'Resonant-1',
  'qwen3-asr': 'Qwen3-ASR-1.7B',
  parakeet: 'Parakeet-TDT-0.6B',
  canary: 'Canary-1B',
  muse: 'Muse Voice Transcribe',
  'nemotron 3.5': 'Nemotron 3.5 Transcribe',
  'scribe v3 realtime': 'Scribe V3 Live',
  'universal-3.7 pro realtime': 'STT 3.7 Realtime Agent',
  'grok voice transcribe 2.0': 'Grok Voice Transcribe 2.0 (Batch)',
  'granite speech': 'Granite-speech-5.0-2b',
  turboctc: 'Granite-speech-5.0-470m-turboctc',
  sravaani: 'SraVaani 1.0',
};

function displayBaseModel(raw: string): string {
  if (raw === 'Gradium STT') return 'Gradium Speech-to-Text';
  const norm = raw.replace(/^(?:NVIDIA[\s_-]+)?(?:Nemotron[\s_-]+)?3\.5[\s_-]+ASR$/i, 'Nemotron 3.5 Transcribe');
  const m = norm.match(/^(Reson8|Alibaba(?: \(Qwen\))?|NVIDIA|Meta|xAI)\s+(.+)$/i);
  const tail = m?.[2] ?? norm;
  const mapped = MODEL_RENAMES[tail.toLowerCase()];
  return mapped ? `${m ? `${m[1]} ` : ''}${mapped}` : norm;
}

function displayModel(creator: string, model: string, language: string): string {
  if (language === 'Hindi') {
    if (model.toLowerCase() === 'scribe v3 realtime') return 'Scribe V3 Live';
    if (model === 'SraVaani') return 'SraVaani 1.0';
    return model;
  }
  if (creator.toLowerCase() === 'murf ai' && model.toLowerCase() === 'finch-1') {
    if (language === 'Indian English') return 'finch_indic_1.0';
    if (language === 'US English' || language === 'Brazilian Portuguese') return 'finch_global_1.0';
  }
  return displayBaseModel(NVIDIA_RENAMES[`${creator.toLowerCase()}::${model.toLowerCase()}`] ?? model);
}

function isOpenSource(creator: string, model: string, csvOpen: boolean): boolean {
  if (csvOpen) return true;
  const c = creator.toLowerCase();
  const m = model.toLowerCase();
  return (
    (c === 'nvidia' && (m === 'nemotron 3.5 transcribe' || m.includes('nemotron 3.5'))) ||
    (c.includes('cohere') && m.includes('cohere transcribe')) ||
    (c === 'ibm' && m.includes('granite-speech')) ||
    ((c.includes('qwen') || c.includes('alibaba')) && m.includes('qwen3-asr'))
  );
}

function formatRowModel(rawCreator: string, shownModel: string): string {
  const creator = rawCreator === 'Microsoft (Azure AI)' ? 'Microsoft' : rawCreator;
  const cFirst = creator.split(/\s+/)[0].toLowerCase();
  const mLow = shownModel.toLowerCase();
  if (
    mLow.startsWith(cFirst) ||
    /^(qwen|gemini|gemma|gpt|whisper|voxtral|grok|canary|parakeet|nemotron|granite|cohere|sravaani|gradium|indicconformer)/i.test(shownModel)
  ) {
    return shownModel;
  }
  return `${creator} ${shownModel}`;
}

interface CsvRow {
  test_set: string;
  set_type: string;
  age_range: string;
  gender: string;
  length: string;
  creator: string;
  model: string;
  wer: number;
  cer?: number;
  sub?: number;
  del?: number;
  ins?: number;
  ci_low?: number;
  ci_high?: number;
  hf_wer?: number;
  samples: number;
  open_source: boolean;
}

function parseNum(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const idx = Object.fromEntries(head.map((h, i) => [h.trim(), i]));
  const out: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const c = line.split(',');
    const wer = parseNum(c[idx.wer]);
    if (wer === undefined) continue;
    out.push({
      test_set: c[idx.test_set],
      set_type: c[idx.set_type],
      age_range: c[idx.age_range],
      gender: c[idx.gender],
      length: c[idx.length],
      creator: c[idx.creator],
      model: c[idx.model],
      wer,
      cer: parseNum(c[idx.cer]),
      sub: parseNum(c[idx.sub]),
      del: parseNum(c[idx.del]),
      ins: parseNum(c[idx.ins]),
      ci_low: parseNum(c[idx.ci_low]),
      ci_high: parseNum(c[idx.ci_high]),
      hf_wer: parseNum(c[idx.hf_wer]),
      samples: parseNum(c[idx.samples]) ?? 0,
      open_source: c[idx.open_source] === 'true',
    });
  }
  return out;
}

function isVisible(r: CsvRow, language: string): boolean {
  const c = r.creator.toLowerCase();
  const m = r.model.toLowerCase();
  if (language === 'Hindi') {
    if (c === 'openai' && (m === 'gpt-4o transcribe' || m === 'gpt-4o-transcribe')) return false;
    if (c === 'xai' && r.model === 'Grok Voice Transcribe 2.0') return false;
    if (c === 'fonadalabs' && m === 'kapture v3') return false;
    if (c === 'google' && (m === 'gemini 3.1 pro' || m === 'gemini 3.5 flash')) return false;
    if (r.test_set === 'Public' && r.model === 'IndicConformer') return false;
  } else if (HIDDEN_NON_HINDI.has(`${c}::${m}`)) {
    return false;
  }
  if (language !== 'US English' && c === 'ibm') return false;
  if (language !== 'Brazilian Portuguese' && c === 'reson8' && m === 'rumble-2') return false;
  return true;
}

const NOISE_PARTS: Array<[string, string]> = [
  ['Clean', 'clean'],
  ['Slightly Noisy', 'slightlyNoisy'],
  ['Moderate', 'moderate'],
  ['Noisy', 'noisy'],
];
const LENGTH_PARTS: Array<[string, string]> = [
  ['Short', 'short'],
  ['Medium', 'medium'],
  ['Long', 'long'],
];
const GENDER_PARTS: Array<[string, string]> = [
  ['Male', 'male'],
  ['Female', 'female'],
];

const AGE_KEY = (band: string) => 'age' + band.replace('+', 'Plus').replace('-', 'To');
const AGE_LABEL = (band: string) => (band.endsWith('+') ? `Age ${band}` : `Age ${band.replace('-', ' to ')}`);

export interface VoiceArenaSttConfig {
  language: string;
  slug: string;
  ageBands: string[];
  hasHfWer?: boolean;
  hasPublicErrorBreakdown?: boolean;
  aliases?: Record<string, string>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const STT_ALIASES: Record<string, string> = {
  'Nemotron 3.5 Transcribe': 'nemotron-3-5-transcribe-30b-a4b',
  'Voxtral Mini Transcribe Realtime': 'voxtral-mini-transcribe-realtime-2602',
  'Qwen3-ASR': 'qwen3-asr-1-7b',
};

export function voiceArenaStt(cfg: VoiceArenaSttConfig): Leaderboard {
  const feed = `${SITE}/data/stt-v2/stt_${cfg.slug}.csv`;
  const parts: Record<string, BoardPart> = {
    publicSplit: { name: 'Public split', group: 'Test split' },
    ...Object.fromEntries(NOISE_PARTS.map(([label, key]) => [key, { name: label, group: 'Noise level' }])),
    ...Object.fromEntries(LENGTH_PARTS.map(([label, key]) => [key, { name: label, group: 'Utterance length' }])),
    ...Object.fromEntries(GENDER_PARTS.map(([label, key]) => [key, { name: label, group: 'Speaker gender' }])),
    ...Object.fromEntries(cfg.ageBands.map((band) => [AGE_KEY(band), { name: AGE_LABEL(band), group: 'Speaker age' }])),
  };
  const stats: Record<string, BoardStat> = {
    cer: { name: 'Semantic CER', unit: '%', better: 'lower' },
    ...(cfg.hasHfWer ? { hfWer: { name: 'Normalized WER', unit: '%', better: 'lower' } } : {}),
    ...(cfg.hasPublicErrorBreakdown
      ? {
          publicSub: { name: 'Public substitution rate', unit: '%', better: 'lower' },
          publicDel: { name: 'Public deletion rate', unit: '%', better: 'lower' },
          publicIns: { name: 'Public insertion rate', unit: '%', better: 'lower' },
        }
      : {}),
  };

  return {
    benchmark: 'voicearena-stt-' + cfg.slug,
    url: `${SITE}/stt-leaderboard/${cfg.slug}`,
    feed,
    terms: 'Public Voice Arena STT leaderboard CSV feed. Site terms apply. The almanac credits and links the source.',
    aliases: { ...STT_ALIASES, ...(cfg.aliases ?? {}) },
    parts,
    stats,
    async fetch(): Promise<LeaderboardRow[]> {
      const all = parseCsv(await fetchText(feed));
      const publicModels = new Set(all.filter((r) => r.test_set === 'Public').map((r) => `${r.creator}::${r.model}`));

      const byModelSlice = new Map<string, CsvRow>();
      for (const r of all) {
        if (!isVisible(r, cfg.language)) continue;
        byModelSlice.set(`${r.creator}::${r.model}|${r.test_set}|${r.set_type}|${r.age_range}|${r.gender}|${r.length}`, r);
      }

      const headlines = all
        .filter((r) => r.test_set === 'Private' && r.set_type === 'All' && r.age_range === 'All' && r.gender === 'All' && r.length === 'All')
        .filter((r) => isVisible(r, cfg.language))
        .filter((r) => cfg.language !== 'Hindi' || publicModels.has(`${r.creator}::${r.model}`));

      if (!headlines.length) throw new Error('Voice Arena STT headline rows missing: ' + cfg.language);

      const rows: LeaderboardRow[] = [];
      for (const r of headlines) {
        const mk = `${r.creator}::${r.model}`;
        const shown = displayModel(r.creator, r.model, cfg.language);
        const model = formatRowModel(r.creator, shown);
        const score = round2(r.wer);
        const metrics: Record<string, number> = {};
        if (r.cer !== undefined) metrics.cer = round2(r.cer);
        if (cfg.hasHfWer && r.hf_wer !== undefined) metrics.hfWer = round2(r.hf_wer);

        const pub = byModelSlice.get(`${mk}|Public|All|All|All|All`);
        if (pub) {
          metrics.publicSplit = round2(pub.wer);
          if (cfg.hasPublicErrorBreakdown) {
            if (pub.sub !== undefined) metrics.publicSub = round2(pub.sub);
            if (pub.del !== undefined) metrics.publicDel = round2(pub.del);
            if (pub.ins !== undefined) metrics.publicIns = round2(pub.ins);
          }
        }
        for (const [label, key] of NOISE_PARTS) {
          const slice = byModelSlice.get(`${mk}|Private|${label}|All|All|All`);
          if (slice) metrics[key] = round2(slice.wer);
        }
        for (const [label, key] of LENGTH_PARTS) {
          const slice = byModelSlice.get(`${mk}|Private|All|All|All|${label}`);
          if (slice) metrics[key] = round2(slice.wer);
        }
        for (const [label, key] of GENDER_PARTS) {
          const slice = byModelSlice.get(`${mk}|Private|All|All|${label}|All`);
          if (slice) metrics[key] = round2(slice.wer);
        }
        for (const band of cfg.ageBands) {
          const slice = byModelSlice.get(`${mk}|Private|All|${band}|All|All`);
          if (slice) metrics[AGE_KEY(band)] = round2(slice.wer);
        }

        const hasCi = r.ci_low !== undefined && r.ci_high !== undefined && r.ci_low <= r.ci_high;
        rows.push({
          model,
          score,
          ...(hasCi ? { low: Math.min(score, r.ci_low!), high: Math.max(score, r.ci_high!) } : {}),
          open: isOpenSource(r.creator, shown, r.open_source),
          metrics,
        });
      }
      return rows;
    },
  };
}
