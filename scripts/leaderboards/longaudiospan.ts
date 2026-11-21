// LongAudioSpan compares audio comprehension across three duration tiers. The headline is the
// paper's Native-MCQ average accuracy. Table 3 gives all three modes and Table 9 splits by language.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://arxiv.org/pdf/2608.26431';
const measures = ['accuracy', 'rubric', 'chain'];
function panel(text: string, languages: boolean) {
  const start = text.indexOf(languages ? 'Table 9: Per-language scores' : 'Table 3: Main results across three evaluation modes');
  if (start < 0) throw new Error('LongAudioSpan table missing');
  const section = text.slice(start).split(/Closed-source Models/);
  if (section.length < 2) throw new Error('LongAudioSpan model groups missing');
  const raw = section[0] + 'Closed-source Models\n' + section[1].trimStart().split(/\n\s*\n/)[0];
  if (!['Accuracy (%)', 'Rubric (%)', 'Chain (%)', ...(languages ? ['EN', 'ZH'] : ['Limit', 'Avg'])].every(s => raw.includes(s)))
    throw new Error('LongAudioSpan columns changed');
  // Three model names are centered vertically between their thinking and non-thinking runs.
  const lines = raw.split('\n');
  const out = new Map<string, { model: string; setting: string; values: string[]; limit?: number; params?: number; open: boolean }>();
  let open = false;
  for (const [i, line] of lines.entries()) {
    if (line.includes('Open-source Models')) open = true;
    if (line.includes('Closed-source Models')) open = false;
    const match = line.match(/^\s*(.*?)\s*([✓✗])\*?\s+(.*)$/);
    if (!match || !/\d+\.\d+\s*$/.test(line)) continue;
    let label = match[1].trim();
    if (!label || /^(?:30B|\(A3B\))$/.test(label)) {
      const nearby = [lines[i - 1], lines[i + 1]].find(v => /^\s*(AudioFlamingoNext|MOSS-Audio|Qwen3-Omni)\s*(?:8B)?\s*$/.test(v));
      if (!nearby) throw new Error('Unlabeled LongAudioSpan run');
      label = nearby.trim() + (nearby.includes('Qwen3-Omni') ? ' 30B' : '');
    }
    const size = label.match(/\s+([\d.]+)B$/);
    const model = label.replace(/\s+(?:[\d.]+B|–)$/, '').trim();
    const setting = match[2] === '✓' ? 'Thinking' : 'Non-thinking';
    const values = match[3].trim().split(/\s+/);
    const limit = languages ? undefined : values.shift();
    if (values.length !== (languages ? 9 : 12)) throw new Error('Incomplete LongAudioSpan results');
    const key = model + '/' + setting;
    if (out.has(key)) throw new Error('Duplicate LongAudioSpan run: ' + key);
    out.set(key, { model, setting, values, open, params: size ? Number(size[1]) : undefined,
      limit: limit?.endsWith('m') ? Number(limit.slice(0, -1)) : undefined });
  }
  return out;
}
export default {
  benchmark: 'longaudiospan', static: 'paper', url: 'https://arxiv.org/abs/2608.26431', feed,
  terms: 'arXiv permits the PDF path in robots.txt. Results are credited to the LongAudioSpan authors.',
  parts: { accuracyS: 'S', accuracyM: 'M', accuracyL: 'L', accuracyEN: 'English', accuracyZH: 'Chinese' },
  aliases: { 'GPT-5.4 (question-only)': 'gpt-5-4', 'GPT-5.4 (transcript)': 'gpt-5-4', 'GPT-5.4 (caption)': 'gpt-5-4' },
  async fetch() {
    const pdf = await pdfText(feed);
    const main = panel(pdf, false), detail = panel(pdf, true);
    if (main.size < 18 || detail.size < 15) throw new Error('Missing LongAudioSpan runs');
    const rows: LeaderboardRow[] = [];
    for (const [key, r] of main) {
      const lang = detail.get(key);
      if (!lang && !r.model.startsWith('GPT-5.4 (')) throw new Error('Missing language results for ' + key);
      const metrics: Record<string, number> = {};
      for (const [i, name] of measures.entries()) {
        for (const [j, tier] of ['S', 'M', 'L', 'Avg'].entries()) {
          const cell = r.values[4 * i + j];
          if (cell !== '–') metrics[name + tier] = Number(cell);
        }
        if (lang) for (const [j, code] of ['EN', 'ZH'].entries()) metrics[name + code] = Number(lang.values[3 * i + j]);
      }
      if (Object.values(metrics).some(v => !Number.isFinite(v))) throw new Error('Invalid LongAudioSpan score');
      if (r.limit) metrics.audioLimitMinutes = r.limit;
      rows.push({ model: r.model, setting: [r.model.match(/\((.*?)\)/)?.[1], r.setting].filter(Boolean).join(', '),
        score: metrics.accuracyAvg, params: r.params, open: r.open, metrics });
    }
    return rows;
  },
} satisfies Leaderboard;
