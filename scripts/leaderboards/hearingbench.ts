// HearingBench asks models to identify 100 sounds from spectrogram images across five 20-clip tiers.
// The headline score is the number of clips answered correctly out of 100.
// This importer reads the scored rows in the leaderboard page's HTML.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://hearing-bench.adamholter.chatgpt.site/';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
const board: Leaderboard = {
  benchmark: 'hearingbench',
  url: PAGE,
  feed: PAGE,
  costPer: 'run',
  terms: 'The page links the source datasets and gives no separate benchmark license. Results are credited to Adam Holter and HearingBench.',
  stats: {
    everyday: { name: 'Everyday sounds correct', unit: 'count', better: 'higher' },
    everydayNearMisses: { name: 'Everyday sounds near misses', unit: 'count' },
    instrument: { name: 'Instrument sounds correct', unit: 'count', better: 'higher' },
    instrumentNearMisses: { name: 'Instrument sounds near misses', unit: 'count' },
    vocal: { name: 'Vocal sounds correct', unit: 'count', better: 'higher' },
    vocalNearMisses: { name: 'Vocal sounds near misses', unit: 'count' },
    words: { name: 'Words correct', unit: 'count', better: 'higher' },
    wordsNearMisses: { name: 'Words near misses', unit: 'count' },
    sentences: { name: 'Sentences correct', unit: 'count', better: 'higher' },
    sentencesNearMisses: { name: 'Sentences near misses', unit: 'count' },
    latency: { name: 'Total run time', unit: 'seconds', better: 'lower' },
  },
  chart: {
    title: 'Clips correct vs. API cost',
    x: { key: 'cost', label: 'API run cost', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Clips correct', better: 'higher' },
    note: 'HearingBench plots clips answered correctly out of 100 against API cost on a log scale with a Pareto frontier.',
  },
  aliases: {
    'Gemini 4 Carbon': 'gemini-4-carbon',
    'Gemini 4 Neon': 'gemini-4-neon',
    'Gemini 4 Argon': 'gemini-4-argon',
    'Gemini 4 Hydrogen': 'gemini-4-hydrogen',
    'Gemini 3.8 Flash': 'gemini-3-8-flash',
    'Claude Opus 5.5': 'claude-opus-5-5',
    'Claude Fable 5.2': 'claude-fable-5-2',
    'Claude Sonnet 5.5': 'claude-sonnet-5-5',
    'Claude Haiku 5.5': 'claude-haiku-5-5',
    'GPT-6.2 Astra': 'gpt-6-2-astra',
    'GPT-6.2 Sol': 'gpt-6-2-sol',
    'GPT-6 Astra': 'gpt-6-astra',
    'GPT-6.1 Sol': 'gpt-6-1-sol',
    'GPT-6.1 Terra': 'gpt-6-1-terra',
    'GPT-6 Luna': 'gpt-6-luna',
    'Grok 4.7': 'grok-4-7',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const boardHtml = html.match(/<ol class="board">([\s\S]*?)<\/ol>/)?.[1];
    if (!boardHtml) throw new Error('HearingBench: leaderboard rows missing');
    const numbersHtml = html.match(/<table id="numbers">([\s\S]*?)<\/table>/)?.[1];
    const numberRows = new Map<string, { tokens?: number; time?: number; cost?: number }>();
    for (const row of numbersHtml?.matchAll(/<tr>([\s\S]*?)<\/tr>/g) ?? []) {
      const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
      const match = cells[0]?.match(/^(.*) \(([^)]+)\)$/);
      if (!match) continue;
      const number = (value: string | undefined, suffix: string) => value?.replace(/[,\s$]/g, '').replace(suffix, '');
      const tokens = number(cells[12], '');
      const time = number(cells[13], 's');
      const cost = number(cells[14], '');
      numberRows.set(match[1] + '|' + match[2], {
        tokens: tokens ? Number(tokens) : undefined,
        time: time ? Number(time) : undefined,
        cost: cost ? Number(cost) : undefined,
      });
    }
    const rows: LeaderboardRow[] = [];
    for (const block of boardHtml.matchAll(/<li class="row(?: [^"]+)?">([\s\S]*?)<\/li>/g)) {
      const body = block[1];
      const name = body.match(/class="model-name">([^<]+)</)?.[1]?.trim();
      const effort = body.match(/class="eff [^"]+">([^<]+)</)?.[1]?.trim();
      const score = body.match(/class="score num">(\d+)</)?.[1];
      if (!name || !effort || score === undefined) continue;
      const numbers = numberRows.get(name + '|' + effort);
      const metrics: Record<string, number> = {};
      const tierNames = ['everyday', 'instrument', 'vocal', 'words', 'sentences'];
      const tips = [...body.matchAll(/data-tip="<b>([^<]+)<\/b><br>(\d+) of 20 correct, (\d+) near misses/g)];
      tips.slice(0, 5).forEach((m, i) => { metrics[tierNames[i]] = Number(m[2]); metrics[`${tierNames[i]}NearMisses`] = Number(m[3]); });
      if (numbers?.time !== undefined && Number.isFinite(numbers.time)) metrics.latency = numbers.time;
      const harness = body.match(/<small>([^<]+)<\/small>/)?.[1]?.replace(/Â·/g, '·').split('·').pop()?.trim();
      rows.push({ model: name, setting: effort, harness, score: Number(score), tokens: numbers?.tokens, cost: numbers?.cost, metrics });
    }
    if (rows.length < 16) throw new Error(`HearingBench: ${rows.length} scored rows, expected at least 16`);
    return rows;
  },
};
export default board;
