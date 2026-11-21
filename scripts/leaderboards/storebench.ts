// StoreBench ranks agents by composite store management score on the main test. AfterQuery publishes confidence intervals and results for eleven tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://www.afterquery.com/blog/storebench#evaluation-results";

const board: Leaderboard = {
  benchmark: "storebench",
  url: "https://www.afterquery.com/blog/storebench#evaluation-results",
  feed,
  terms: "The main table includes 13 models and separate human and scripted references. AfterQuery claims copyright in its site content. The MIT license covers the repository. https://www.afterquery.com/terms robots.txt permits crawling.",
  async fetch() {
    const all = tables(await fetchText(feed));
    const main = all.find(t => t[0]?.[2]?.text.startsWith('Pass rate'));
    const tasks = all.find(t => t[0]?.[0]?.text === 'Evaluation task');
    if (!main || !tasks || tasks.length < 12) throw new Error('Missing StoreBench tables');
    const rows = main.slice(1).filter(c => !/baseline/i.test(c[0].text)).map(c => {
      const model = c[0].text, col = tasks[0].findIndex(k => k.text === model);
      const read = (v: string) => { const n = num(v); if (n === undefined) throw new Error('Missing StoreBench value'); return n; };
      const interval = (v: string) => { const m = v.match(/95% CI ([\d.]+) to ([\d.]+)/); if (!m) throw new Error('Missing StoreBench interval'); return [Number(m[1]), Number(m[2])]; };
      const [low,high] = interval(c[1].text), [passLow,passHigh] = interval(c[2].text);
      const metrics: Record<string,number> = { passRate:read(c[2].text), passLow, passHigh };
      for (const [i,k] of ['Business','Reliability','Continuity'].entries()) metrics[k] = read(c[i+3].text);
      for (const task of tasks.slice(1)) {
        const key = task[0].text;
        metrics[key] = read(task[col]?.text ?? '');
        (board.parts ??= {})[key] = key;
      }
      return { model, score:read(c[1].text), low, high, trials:99, metrics };
    });
    if (rows.length < 13) throw new Error('Missing main-test models');
    return rows;
  },
};

export default board;
