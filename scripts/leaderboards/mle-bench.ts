// MLE-bench. The leaderboard is the first markdown table under "## Leaderboard" in the openai/mle-bench
// README: per agent and LLM, any-medal rates on the Low (Lite), Medium and High splits and on All 75
// competitions, run time and date. The table is ordered by All (%), the score here. The agent is the
// harness. Rows whose LLM column names several models ("o3 + GPT-4.1") or none ("undisclosed") have no
// single model to credit and are skipped. Run budgets other than the usual 24 hours go in the setting. Rows carry their
// submission date, so the resolver picks the snapshot current at that date.
// The "Additional Leaderboard Submissions" table is marked not comparable and is not read. Each row also keeps
// the ± after All (%) as metrics.ciLow and ciHigh (All minus and plus it), and the Low (Lite), Medium and High
// split rates as "low", "medium" and "high" (%). OpenAI stopped
// taking submissions on 2026-04-24.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/openai/mle-bench/main/README.md';

/** Markdown cell to plain text: links, footnote markers, <br> and inline HTML dropped. */
const plain = (s: string) =>
  s
    .replace(/\[\^\d+\]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const board: Leaderboard = {
  benchmark: 'mle-bench',
  url: 'https://github.com/openai/mle-bench#leaderboard',
  feed: `${FEED} (main leaderboard table, All %)`,
  terms: 'Markdown table in the openai/mle-bench README; the repository code is MIT-licensed (GitHub lists the license as custom because of a note on external datasets).',
  aliases: {
    'llama-3.1-405b-instruct': 'llama-3-1-405b',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const start = md.indexOf('## Leaderboard');
    const end = md.indexOf('### Additional Leaderboard Submissions', start);
    if (start < 0) throw new Error('no Leaderboard section in the MLE-bench README');
    const lines = md.slice(start, end > 0 ? end : undefined).split('\n').filter((l) => l.trim().startsWith('|'));
    const head = lines[0]?.split('|').slice(1, -1).map((c) => c.trim());
    const at = (name: string) => head?.findIndex((h) => h.startsWith(name)) ?? -1;
    const [agent, llm, all, hours, date] = [at('Agent'), at('LLM'), at('All'), at('Running Time'), at('Date')];
    const splits = [['low', at('Low')], ['medium', at('Medium')], ['high', at('High')]] as const;
    if ([agent, llm, all].some((i) => i < 0)) throw new Error(`unexpected MLE-bench header: ${head?.join(' | ')}`);
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(2)) {
      const cells = line.split('|').slice(1, -1);
      const score = num(plain(cells[all] ?? '').split('±')[0]);
      let model = plain(cells[llm] ?? '');
      if (score === undefined || !model || /\+|,|ensemble|undisclosed/i.test(model)) continue;
      const settings: string[] = [];
      // "gpt-5 (low verbosity/effort)"
      const paren = model.match(/\s*\(([^)]*)\)$/);
      if (paren) {
        model = model.slice(0, paren.index).trim();
        if (/low verbosity\/effort/i.test(paren[1])) settings.push('low');
      }
      const h = num(cells[hours]);
      if (h && h !== 24) settings.push(`${h} h`);
      const d = plain(cells[date] ?? '');
      const metrics: Record<string, number> = {};
      const pm = num(plain(cells[all] ?? '').split('±')[1]);
      if (pm !== undefined && pm > 0) Object.assign(metrics, { ciLow: score - pm, ciHigh: score + pm });
      for (const [k, i] of splits) {
        const v = i >= 0 ? num(plain(cells[i] ?? '').split('±')[0]) : undefined;
        if (v !== undefined) metrics[k] = v;
      }
      rows.push({
        model,
        score,
        harness: plain(cells[agent] ?? '') || undefined,
        setting: settings.join(', ') || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(d) ? d : undefined,
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no rows in the MLE-bench leaderboard table');
    return rows;
  },
};
export default board;
