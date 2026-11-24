// Full-Duplex-Bench v3 reports tool-use Pass@1 fractions, converted to percent.
// Difficulty, disfluency, domain and latency breakdowns from script.js remain attached alongside
// turn-taking, interruption and filler metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, jsLiteral } from '../lib/html.ts';

const FEED = "https://daniellin94144.github.io/FDB-v3-demo/";
const SCRIPT = "https://daniellin94144.github.io/FDB-v3-demo/script.js";
const board: Leaderboard = {
  benchmark: "full-duplex-bench-3",
  url: FEED,
  feed: FEED,
  terms: 'The benchmark authors publish this public feed. Their source license and site terms apply.',
  aliases: {
    'Gemini 3.1 Live [voice system]': 'gemini-3-1-flash-live',
  },
  parts: {
    easy: { name: 'Easy', group: 'Difficulty' },
    medium: { name: 'Medium', group: 'Difficulty' },
    hard: { name: 'Hard', group: 'Difficulty' },
    disfluencyFiller: { name: 'Filler', group: 'Disfluency' },
    disfluencyPause: { name: 'Pause', group: 'Disfluency' },
    disfluencyHesitation: { name: 'Hesitation', group: 'Disfluency' },
    disfluencyFalseStart: { name: 'False start', group: 'Disfluency' },
    disfluencySelfCorr: { name: 'Self-correction', group: 'Disfluency' },
    ecommerce: { name: 'Ecommerce', group: 'Domain' },
    finance: { name: 'Finance', group: 'Domain' },
    housing: { name: 'Housing', group: 'Domain' },
    travel: { name: 'Travel', group: 'Domain' },
  },
  stats: {
    argumentAccuracy: { name: 'Argument accuracy', unit: '%', better: 'higher' },
    filler: { name: 'Filler rate', unit: '%', better: 'lower' },
    interrupt: { name: 'Interruption rate', unit: '%', better: 'lower' },
    latency: { name: 'Task completion latency', unit: 'seconds', better: 'lower' },
    responseQuality: { name: 'Response quality', unit: '%', better: 'higher' },
    toolSelection: { name: 'Tool selection accuracy', unit: '%', better: 'higher' },
    turnTaking: { name: 'Turn-taking score', unit: '%', better: 'higher' },
    firstWordLatency: { name: 'First word latency', unit: 'seconds', better: 'lower' },
    toolCallLatency: { name: 'Tool call latency', unit: 'seconds', better: 'lower' },
  },

  async fetch() {
    const [html, js] = await Promise.all([fetchText(FEED), fetchText(SCRIPT)]);
    const t = tables(html)[0];
    if (!t?.[1]?.some((c) => c.text.includes('Pass@1'))) throw new Error('Missing main results');

    const dataSection = js.split('// ===================== DEMO EXAMPLES')[0].replace(/'([^']*)'/g, '"$1"');
    const mIdx = dataSection.indexOf('const MODELS = ');
    const dIdx = dataSection.indexOf('const DATA = ');
    if (mIdx < 0 || dIdx < 0) throw new Error('Missing FDB-v3 chart data');
    const chartModels = jsLiteral<{ name: string }[]>(dataSection, mIdx + 'const MODELS = '.length);
    const chartData = jsLiteral<Record<string, { categories: string[]; values: number[][] }>>(dataSection, dIdx + 'const DATA = '.length);
    const indexByName = new Map(chartModels.map((m, i) => [m.name.toLowerCase(), i]));

    return t.slice(2).map((r) => {
      const rawName = r[0].text.trim();
      const idx = indexByName.get(rawName.toLowerCase()) ?? indexByName.get(rawName.replace(/\s+Live$/i, '').toLowerCase());
      const extra: Record<string, number> = {};
      if (idx !== undefined) {
        const diff = chartData.difficulty?.values[idx];
        if (diff?.length === 3) {
          extra.easy = diff[0] * 100;
          extra.medium = diff[1] * 100;
          extra.hard = diff[2] * 100;
        }
        const dis = chartData.disfluency?.values[idx];
        if (dis?.length === 5) {
          extra.disfluencyFiller = dis[0] * 100;
          extra.disfluencyPause = dis[1] * 100;
          extra.disfluencyHesitation = dis[2] * 100;
          extra.disfluencyFalseStart = dis[3] * 100;
          extra.disfluencySelfCorr = dis[4] * 100;
        }
        const dom = chartData.domain?.values[idx];
        if (dom?.length === 4) {
          extra.ecommerce = dom[0] * 100;
          extra.finance = dom[1] * 100;
          extra.housing = dom[2] * 100;
          extra.travel = dom[3] * 100;
        }
        const lat = chartData.latency?.values[idx];
        if (lat?.length === 3) {
          extra.firstWordLatency = lat[0];
          extra.toolCallLatency = lat[1];
        }
      }
      return {
        model: rawName + ' [voice system]',
        score: num(r[4].text)! * 100,
        setting: 'v3 tool use',
        metrics: {
          toolSelection: num(r[1].text)! * 100,
          argumentAccuracy: num(r[2].text)! * 100,
          responseQuality: num(r[3].text)! * 100,
          turnTaking: num(r[5].text)!,
          latency: num(r[6].text)!,
          interrupt: num(r[7].text)!,
          filler: num(r[8].text)!,
          ...extra,
        },
      };
    });
  },
};
export default board;
