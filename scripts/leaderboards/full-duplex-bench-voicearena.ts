// The source reports no overall score. The headline is the plain mean of the 10 parts, computed by this importer.
// Voice Arena tests four conversational behaviors. Each language's published score averages their success rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://voicearena.com/full-duplex-bench';
const languages = ['Indian English', 'Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Marathi', 'Kannada', 'Telugu', 'Tamil', 'Malayalam'];
const keys = ['pauseSr', 'turnSr', 'turnLatency', 'bcSr', 'bcJsd', 'bcFreq', 'intSr', 'intLatency', 'intRating', 'avgSr', 'rank'];
const metricNames: Record<string, { name: string; unit: string; better?: 'higher'|'lower'; note?: string }> = {
  pauseSr: { name: 'Pause success rate', unit: '%', better: 'higher' }, turnSr: { name: 'Turn success rate', unit: '%', better: 'higher' },
  turnLatency: { name: 'Turn latency', unit: 'seconds', better: 'lower' }, bcSr: { name: 'Backchannel success rate', unit: '%', better: 'higher' },
  bcJsd: { name: 'Backchannel Jensen Shannon divergence', unit: 'score', better: 'lower' }, bcFreq: { name: 'Backchannel frequency', unit: 'score', note: 'Frequency measured on a 0 to 1 scale.' },
  intSr: { name: 'Interruption success rate', unit: '%', better: 'higher' }, intLatency: { name: 'Interruption latency', unit: 'seconds', better: 'lower' },
  intRating: { name: 'Interruption rating', unit: 'rating', better: 'higher' }, rank: { name: 'Language rank', unit: 'count', better: 'lower' },
};
const stats = Object.fromEntries(languages.flatMap(language => Object.entries(metricNames).map(([key, value]) => [language.replaceAll(' ', '') + '_' + key, { ...value, name: language + ' ' + value.name }])));
const board: Leaderboard = {
  benchmark: 'full-duplex-bench-voicearena', url: feed, feed, terms: 'Voice Arena publishes its public leaderboard at https://voicearena.com/full-duplex-bench.',
  parts: Object.fromEntries(languages.map(name => [name.replaceAll(' ', ''), name])),
  stats,
  headline: 'Voice Arena reports no cross-language score, so this is the plain mean of its ten language success rates.',
  async fetch() {
    const html = await fetchText(feed);
    const main = /<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
    if (!main) throw new Error('Missing application bundle');
    const indexUrl = new URL(main, feed);
    const index = await fetchText(indexUrl.href);
    const chunk = /import\("\.\/(FullDuplexBench-[^"]+\.js)"\)/.exec(index)?.[1];
    if (!chunk) throw new Error('Missing leaderboard bundle');
    const source = await fetchText(new URL(chunk, indexUrl).href);
    const columns = /language:\w+,model:\w+,([^}]+)\}\)\)/.exec(source)?.[1].split(',').map(field => field.split(':')[0]);
    if (columns?.join() !== keys.join()) throw new Error('Changed results columns');
    const names = new Map(Array.from(source.matchAll(/\{key:"([^"]+)",name:"([^"]+)",maker:/g), m => [m[1], m[2]]));
    const byModel = new Map<string, Record<string, number>>();
    for (const match of source.matchAll(/\["([^"]+)","([^"]+)",([\d.,null-]+)\]/g)) {
      const [, language, id, raw] = match;
      if (!languages.includes(language) || id === 'human') continue;
      if (!names.has(id)) throw new Error('Unknown model ' + id);
      const lang = language.replaceAll(' ', '');
      const metrics = byModel.get(id) ?? {};
      const cells = raw.split(',').map(cell => cell === 'null' ? undefined : Number(cell));
      if (lang in metrics || cells.length !== keys.length || !Number.isFinite(cells[9])) throw new Error('Invalid model-language row');
      metrics[lang] = cells[9]!;
      cells.forEach((value, i) => { if (value !== undefined && i !== 9) metrics[lang + '_' + keys[i]] = value; });
      byModel.set(id, metrics);
    }
    const rows: LeaderboardRow[] = [];
    for (const [id, metrics] of byModel) {
      const scores = Object.keys(board.parts!).map(lang => metrics[lang]);
      if (!scores.every(Number.isFinite)) continue;
      const name = names.get(id)!;
      const thinking = name.endsWith(' Extended Thinking');
      rows.push({ model: thinking ? name.slice(0, -' Extended Thinking'.length) : name, setting: thinking ? 'Extended Thinking' : undefined,
        metrics, score: scores.reduce((sum, n) => sum + n, 0) / scores.length });
    }
    return checked(rows, 4);
  },
};
export default board;
