// BIRD-SQL. bird-bench.github.io is a static page whose first table is the main leaderboard: per entry the
// submission date, the model or system (name, then affiliation), code link, size, whether oracle knowledge
// (the evidence hints) was given, and execution accuracy on Dev and on the hidden Test set. Test (%) is the
// ranking and the score; the Dev column mixes the original and the 2025-11-06 dev sets. Rows without oracle knowledge are retained with an explicit setting.
// The reported Dev score remains a metric because the board mixes dev-set versions. Most entries are text-to-SQL systems built on a model ("CHASE-SQL + Gemini"), which the
// explicit system/model pairs are kept separately from the plain-model baselines.
// The date badge is the submission date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const URL = 'https://bird-bench.github.io/';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Sep 07, 2026" or "July 08, 2025" as YYYY-MM-DD; undefined for impossible dates such as "Jun 31". */
function badgeDate(s: string): string | undefined {
  const m = s.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),\s*(\d{4})$/);
  const mon = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  if (!m || mon < 0) return undefined;
  const d = new Date(Date.UTC(Number(m[3]), mon, Number(m[2])));
  return d.getUTCDate() === Number(m[2]) ? d.toISOString().slice(0, 10) : undefined;
}

const board: Leaderboard = {
  benchmark: 'bird-sql',
  harnesses: 'system',
  url: URL,
  feed: `${URL} (main leaderboard table, Test %)`,
  terms: 'Static GitHub Pages site of the BIRD project; there is no robots.txt and the site publishes no terms of use.',
  aliases: {
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    // Cohere's entry links CohereLabs/c4ai-command-a-03-2025
    'Command A': 'cohere-command-a',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => {
      const head = rows[0]?.map((c) => c.text) ?? [];
      return head.includes('Oracle Knowledge') && head.includes('Test (%)');
    });
    if (!t) throw new Error('BIRD main leaderboard table not found');
    const head = t[0].map((c) => c.text);
    const [iModel, iOracle, iTest] = [head.indexOf('Model'), head.indexOf('Oracle Knowledge'), head.indexOf('Test (%)')];
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      // the model cell is "Name<br><span class="affiliation">Team</span>..."
      let model = text(r[iModel]?.html.split(/<br|<span/i)[0] ?? '');
      const score = num(r[iTest]?.text);
      if (!model || score === undefined || /human performance/i.test(model)) continue;
      const oracle = /✔/.test(r[iOracle]?.text ?? '');
      const dev = num(r[head.indexOf('Dev (%)')]?.text);
      const submitter = text(r[iModel]?.html.match(/<span\b[^>]*class="affiliation"[^>]*>([\s\S]*?)<\/span\s*>/i)?.[1] ?? '') || undefined;
      const code = r[head.indexOf('Code')]?.html.match(/href="(https:\/\/[^"\s]+)"/i)?.[1];
      const link = code && !/^https:\/\/(huggingface\.co|developers\.openai\.com)\//.test(code) ? code : undefined;
      const size = r[head.indexOf('Size')]?.text.match(/^(\d+(?:\.\d+)?)\s*([BM])(?:-(\d+(?:\.\d+)?)B-MoE)?$/i);
      const params = size ? Number(size[1]) / (size[2].toUpperCase() === 'M' ? 1000 : 1) : undefined;
      let harness: string | undefined;
      const agent = model.match(/^(.+?)\s*\+\s*((?:GPT-|Gemini|Qwen|XiYanSQL-|granite-|DeepSeek|gpt-oss-).*)$/);
      const flash = model.match(/^(flash-sqlite(?:-4b)?): (Qwen\S+) Generator/);
      if (agent) { harness = agent[1].trim(); model = agent[2].trim(); }
      else if (flash) { harness = flash[1]; model = flash[2]; }
      else if (model === 'SFT CodeS-15B + SQLFixAgent') { harness = 'SQLFixAgent'; model = 'SFT CodeS-15B'; }
      rows.push({ model, score, date: badgeDate(r[0]?.text ?? ''),
        harness, submitter, link, params,
        setting: oracle ? undefined : 'without oracle knowledge',
        metrics: { ...(dev === undefined ? {} : { developmentReported: dev }),
          ...(size?.[3] ? { activeParams: Number(size[3]) } : {}) },
      });
    }
    return rows;
  },
};
export default board;
