// SpeechIO ranks Mandarin transcription systems by character error rate across all test sets. The README also reports locked, unlocked and individual test-set scores.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/SpeechColab/Leaderboard/master/README.md";
function percent(value: string) {
  if (!/^\d+(?:\.\d+)?%$/.test(value)) throw new Error('Invalid SpeechIO CER: ' + value);
  return parseFloat(value);
}

const board: Leaderboard = {
  benchmark: "speechio-asr-leaderboard",
  url: "https://github.com/SpeechColab/Leaderboard#5-latest-results",
  feed: FEED,
  terms: "The January 2025 table lists seven public systems and one private system. The repository does not state reuse terms at https://github.com/SpeechColab/Leaderboard.",
  async fetch() {
    const page = (await fetchText(FEED)).split('## 5. Latest Results')[1];
    if (!page) throw new Error('Missing SpeechIO results');
    board.parts = { Locked: 'Locked', Unlocked: 'Unlocked' };
    const rows = [];
    for (const scope of ['Public', 'Private']) {
      const section = page.split('### ' + scope + ' Models')[1]?.split(/^### /m)[0];
      if (!section) throw new Error('Missing ' + scope + ' models');
      const scores = new Map<string, Record<string, number>>();
      for (const split of ['Unlocked', 'Locked', 'All']) {
        const source = section.split('#### **' + split + '** SpeechIO test sets')[1];
        if (!source) throw new Error('Missing SpeechIO split ' + split);
        const table = markdownTables(source)[0];
        const headers = table[0];
        const modelCol = headers.indexOf('Model 模型'), cer = headers.indexOf('CER 字错误率'), date = headers.indexOf('Date 时间');
        if ([modelCol, cer, date].includes(-1) || table.length < (scope === 'Public' ? 8 : 2)) throw new Error('Incomplete SpeechIO table');
        for (const cells of table.slice(1)) {
          const model = cells[modelCol].replace(/\(\*?\)$/, '');
          const metrics = scores.get(model) ?? {};
          metrics[split] = percent(cells[cer]);
          if (!/^\d{4}\.\d{2}$/.test(cells[date])) throw new Error('Unexpected SpeechIO result month');
          metrics.resultYearMonth = Number(cells[date].replace('.', ''));
          scores.set(model, metrics);
        }
      }
      const detail = markdownTables(section).find(t => t[0][0] === 'Test Set ID');
      if (detail) for (const cells of detail.slice(1)) {
        const key = cells[0];
        for (const [column, model] of detail[0].entries()) {
          const metrics = scores.get(model);
          if (!metrics) continue;
          if (!cells[column] || !Number.isFinite(Number(cells[column]))) throw new Error('Invalid SpeechIO test-set score');
          metrics[key] = Number(cells[column]);
          board.parts[key] = { name: key + ' ' + cells[1], group: 'Test Set' };
        }
      }
      for (const [model, { All: score, ...metrics }] of scores) {
        if (![score, metrics.Locked, metrics.Unlocked].every(Number.isFinite)) throw new Error('Missing SpeechIO split for ' + model);
        rows.push({ model, score, metrics });
      }
    }
    return rows;
  },
};
export default board;
