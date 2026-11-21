// AssemblyAI's speech benchmark compares transcription systems across error-rate suites.
// The headline score is the page's mean rank across its nine headline metrics, where lower is better.
// This importer reads the benchmark tables embedded in the public AssemblyAI benchmarks page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const PAGE = 'https://www.assemblyai.com/benchmarks';
const num = (s: string | undefined) => {
  if (!s || s === '—' || s === '≈') return undefined;
  const n = Number(s.replace(/[%\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

const board: Leaderboard = {
  benchmark: 'assemblyai-speech-benchmarks',
  url: PAGE,
  feed: `${PAGE} (the page's headline comparison table and its component metric tables)`,
  terms: 'AssemblyAI publishes the benchmark page and does not state a separate result reuse license. Results are credited to AssemblyAI with a link to the source.',
  aliases: {
    'Voxtral Mini Transcribe 2': 'voxtral-mini-transcribe-2',
    'Gemini 3.5 Transcribe': 'gemini-3-5-transcribe',
    'OpenAI GPT-4o Transcribe': 'gpt-4o-transcribe',
  },
  parts: {
    cleanWer: { name: 'WER, clean', group: 'Headline metrics', note: 'Mean word error rate on clean-reference speech.' },
    verbatimWer: { name: 'WER, verbatim', group: 'Headline metrics', note: 'Mean word error rate on verbatim-reference speech.' },
    accentedWer: { name: 'WER, accented', group: 'Headline metrics', note: 'Mean word error rate on accented English speech.' },
    entities: { name: 'Entities', group: 'Headline metrics', note: 'Mean missed-entity error rate.' },
    cpWer: { name: 'cpWER', group: 'Headline metrics', note: 'Mean concatenated minimum-permutation word error rate.' },
    der: { name: 'DER', group: 'Headline metrics', note: 'Mean diarization error rate.' },
    codeSwitching: { name: 'Code-switching', group: 'Headline metrics', note: 'Mean code-switching word error rate.' },
    multilingual: { name: 'Multilingual', group: 'Headline metrics', note: 'Mean multilingual error rate.' },
  },
  async fetch() {
    const ts = tables(await fetchText(PAGE));
    const t = ts.find((x) => x[0]?.map((c) => c.text).join('|') === 'System|WER, clean|WER, verbatim|WER, accented|Entities|cpWER|DER|Code-switching|Multilingual|mean rank');
    if (!t) throw new Error('AssemblyAI Speech Benchmarks: headline table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const model = r[0]?.text?.trim();
      if (!model || r.length < 10) continue;
      const score = num(r[9].text);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      const keys = ['cleanWer', 'verbatimWer', 'accentedWer', 'entities', 'cpWer', 'der', 'codeSwitching', 'multilingual'];
      for (let i = 0; i < keys.length; i++) {
        const v = num(r[i + 1]?.text);
        if (v !== undefined) metrics[keys[i]] = v;
      }
      rows.push({ model, score, metrics });
    }
    if (rows.length < 15) throw new Error(`AssemblyAI Speech Benchmarks: ${rows.length} rows, expected at least 15`);
    return rows;
  },
};
export default board;
