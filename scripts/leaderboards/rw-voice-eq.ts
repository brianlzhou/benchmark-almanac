// Real World VoiceEQ evaluates voice systems with human ratings across real-world speech tasks.
// This importer reads the public Gradio configuration, whose Text-to-Speech panel embeds the official Overall score
// and its factor columns in an HTML table. Overall is a 0 to 1 TOPSIS score, where higher is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://huggingface.co/spaces/HumeAI/rw-voice-eq';
const CONFIG = 'https://humeai-rw-voice-eq.hf.space/config';
const FACTORS = ['actingRoleFit', 'expressiveness', 'voiceIdentity', 'languageStability', 'reliability', 'extendedLongFormStability', 'longFormStability', 'multilingualLongFormStability', 'acousticQuality'] as const;
const PARTS = {
  actingRoleFit: { name: 'Acting / Role-fit', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  expressiveness: { name: 'Expressiveness', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  voiceIdentity: { name: 'Voice identity', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  languageStability: { name: 'Language Stability', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  reliability: { name: 'Reliability', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  extendedLongFormStability: { name: 'Extended Long-Form Stability', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  longFormStability: { name: 'Long-form Stability', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  multilingualLongFormStability: { name: 'Multilingual Long-Form Stability', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
  acousticQuality: { name: 'Acoustic Quality', unit: 'score', note: 'Mean human rating from the Text-to-Speech panel.' },
};

const board: Leaderboard = {
  benchmark: 'rw-voice-eq',
  url: PAGE,
  feed: `${CONFIG} (Text-to-Speech panel table)`,
  terms: 'The Space is Apache-2.0. Its backing dataset is private, while this public configuration publishes the leaderboard table. https://huggingface.co/spaces/HumeAI/rw-voice-eq',
  parts: PARTS,
  async fetch() {
    const config = JSON.parse(await fetchText(CONFIG)) as { components?: { props?: { value?: unknown } }[] };
    const value = config.components?.map((c) => c.props?.value).find((v): v is string => typeof v === 'string' && v.includes("data-fname='text-to-speech'"));
    if (!value) throw new Error('Real World VoiceEQ: Text-to-Speech table missing from public config');
    const rows: LeaderboardRow[] = [];
    for (const match of value.matchAll(/<tr[^>]*>\s*<td class='rank'>\s*\d+\s*<\/td>\s*<td class='prov'>\s*([^<]+?)\s*<\/td>([\s\S]*?)<\/tr>/g)) {
      const model = match[1].trim();
      const cells = [...match[2].matchAll(/<td(?:[^>]*data-v='([^']*)'[^>]*)>/g)].map((m) => m[1] === '' ? undefined : Number(m[1]));
      if (cells.length !== FACTORS.length + 1 || cells[0] === undefined || !Number.isFinite(cells[0])) throw new Error(`Real World VoiceEQ: invalid TTS row for ${model}`);
      const metrics = Object.fromEntries(FACTORS.flatMap((key, i) => cells[i + 1] !== undefined && Number.isFinite(cells[i + 1]) ? [[key, cells[i + 1] as number]] : []));
      rows.push({ model, score: cells[0], harness: 'Text-to-Speech', metrics });
    }
    if (rows.length < 20) throw new Error(`Real World VoiceEQ: ${rows.length} TTS rows, expected at least 20`);
    return rows;
  },
};
export default board;
