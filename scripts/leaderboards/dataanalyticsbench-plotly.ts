// DataAnalyticsBench asks models 43 questions against a private synthetic data warehouse.
// The headline score is the number of questions answered correctly, and cost, tokens and speed remain as metrics.
// This importer reads the server-rendered results table on Plotly's benchmark article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://plotly.com/blog/introducing-dataanalyticsbench/';
const HEAD = '<p><strong>Model</strong></p>';

const seconds = (value: string): number => {
  const m = value.trim().match(/^(?:(\d+(?:\.\d+)?)\s*h\s*)?(?:(\d+(?:\.\d+)?)\s*min\s*)?(\d+(?:\.\d+)?)?\s*s?$/i);
  if (!m) {
    const min = value.match(/(\d+(?:\.\d+)?)\s*min/i);
    if (min) return Number(min[1]) * 60;
    throw new Error(`DataAnalyticsBench: bad duration ${value}`);
  }
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
};
const totalMinutes = (value: string): number => {
  const h = value.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1];
  const m = value.match(/(\d+(?:\.\d+)?)\s*min/i)?.[1];
  if (!h && !m) return NaN;
  return Number(h ?? 0) * 60 + Number(m ?? 0);
};

const board: Leaderboard = {
  benchmark: 'dataanalyticsbench-plotly',
  url: PAGE,
  feed: `${PAGE} (server-rendered results table)`,
  terms: 'Plotly allows public content on plotly.com to be used for training and AI search. No separate score-reuse license is stated for this table.',
  costPer: 'run',
  stats: { accuracyPercent: { name: 'Accuracy', unit: '%', better: 'higher' }, costPerRun: { name: 'Cost per run', unit: 'usd', better: 'lower' }, tokensExam: { name: 'Tokens per exam', unit: 'tokens', better: 'lower' }, medianSeconds: { name: 'Median seconds per question', unit: 'seconds', better: 'lower' }, meanSeconds: { name: 'Mean seconds per question', unit: 'seconds', better: 'lower' }, totalMinutes: { name: 'Total exam time', unit: 'minutes', better: 'lower' } },
  reference: ['Plotly Studio Embedded'],
  aliases: {
    'Hy4 flash': 'tencent-hy4-preview',
    'Hy4': 'tencent-hy4',
    'Qwen4 Max': 'qwen4-max',
    'Ripple-65B Preview': 'ripple-65b-preview',
    'Beam 1.0': 'beam-1-0',
    'Muse Spark Open': 'muse-spark-open',
    'Muse Spark 1.3': 'muse-spark-1-3',
    'Nemotron 3.5 Super VL': 'nemotron-3-5-super-vl',
    'Nemotron 3.5 Lightning': 'nemotron-3-5-lightning-30b-a3b',
    'Solar Mini 4': 'solar-mini-4',
    'Command A+': 'command-a-plus',
    'Ember-1': 'ember-1',
  },
  chart: {
    title: 'Score against run cost',
    x: { key: 'costPerRun', label: 'Cost per run', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Questions correct', unit: 'score', better: 'higher' },
    note: 'The article compares the 43-question score with the median cost of one complete run.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const marker = html.indexOf(HEAD);
    if (marker < 0) throw new Error('DataAnalyticsBench results table missing');
    const start = html.lastIndexOf('<section', marker);
    const end = html.indexOf('</section>', marker);
    if (start < 0 || end < 0) throw new Error('DataAnalyticsBench results section missing');
    const cells = [...html.slice(start, end).matchAll(/<p(?: [^>]*)?>([\s\S]*?)<\/p>/g)].map((m) => text(m[1]));
    const columns = 7;
    if (cells.length < columns + columns * 50 || cells.slice(0, columns).join('|') !== 'Model|Released|Score|Cost per run (median per question)|Tokens (whole exam)|Median / mean time per question|Total time')
      throw new Error(`DataAnalyticsBench table changed: ${cells.length} cells`);
    const rows: LeaderboardRow[] = [];
    for (let i = columns; i + columns <= cells.length; i += columns) {
      const [rawModel, released, rawScore, rawCost, rawTokens, rawTime, rawTotal] = cells.slice(i, i + columns);
      const model = rawModel.replace(/†$/, '').trim();
      const score = Number(rawScore.match(/\d+/)?.[0]);
      const cost = Number(rawCost.match(/\$([\d.]+)/)?.[1]);
      const tokens = Number(rawTokens.match(/([\d.]+)M/i)?.[1]) * 1_000_000;
      const timeParts = rawTime.split('/').map((part) => part.trim());
      if (!model || !/^\w{3} \d{1,2}, 20\d{2}$/.test(released) || !Number.isFinite(score) || !Number.isFinite(cost) || !Number.isFinite(tokens) || (timeParts.length !== 1 && timeParts.length !== 2))
        throw new Error(`DataAnalyticsBench row is incomplete for ${rawModel}`);
      const medianSeconds = seconds(timeParts[0]);
      const meanSeconds = timeParts.length < 2 || timeParts[1].toLowerCase() === 'n/a' ? undefined : seconds(timeParts[1]);
      const total = totalMinutes(rawTotal);
      rows.push({
        model,
        score,
        date: new Date(released).toISOString().slice(0, 10),
        cost,
        metrics: {
          accuracyPercent: score / 43 * 100,
          costPerRun: cost,
          tokensExam: tokens,
          medianSeconds,
          ...(meanSeconds === undefined ? {} : { meanSeconds }),
          ...(Number.isFinite(total) ? { totalMinutes: total } : {}),
        },
      });
    }
    if (rows.length < 50) throw new Error(`DataAnalyticsBench: ${rows.length} models, expected at least 50`);
    return rows;
  },
};
export default board;
