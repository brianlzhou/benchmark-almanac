// KMMLU-Pro main and small-model results, with prompt comparisons and the 14 license exams from the appendix.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2507.08924';
const board: Leaderboard = {
  benchmark:'kmmlu-pro',url:'https://arxiv.org/abs/2507.08924',feed,terms:PAPER_TERMS,
  aliases:{"GPT-4.1 mini (2025-04-14)": "gpt-4-1-mini", "GPT-4.1 (2025-04-14)": "gpt-4-1", "o3-mini (2025-01-31)": "o3-mini", "o4-mini (2025-04-16)": "o4-mini", "Gemma 3 12B IT": "gemma-3-12b", "C4AI Command A": "cohere-command-a", "Mistral Small 3.1 Instruct": "mistral-small-3-1", "Llama-4-Scout-17B-16E-Instruct": "llama-4-scout", "Llama-4-Maverick-17B-128E-Instruct": "llama-4-maverick"},
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const main = ts.filter(t => t[0]?.[2] === 'KMMLU-Pro' && t[1]?.[3] === '# of passed KNPLs');
    const licenses = ts.find(t => t[1]?.[2] === 'Judicial Scrivener' && t[1]?.includes('Avg.'));
    const prompts = ts.find(t => t[0]?.[4] === 'KMMLU-Pro' && t[1]?.[4] === 'English');
    if (!main.length || !licenses || !prompts) throw new Error('KMMLU-Pro result tables missing');
    board.parts = Object.fromEntries(licenses[1].slice(2, -2).map((name, i) => [name, { name, group: licenses[0][i + 2] }]));
    const rows: LeaderboardRow[] = [];
    const used = new Set<string>();
    for (const table of main) {
      let open = true;
      for (const r of table.slice(2)) {
        if (r[0] === 'Closed Models') { open = false; continue; }
        if (!/^\d+(\.\d+)?$/.test(r[2] ?? '')) continue;
        const name = r[0].replace(/\s*\(\s*[A-Za-z][^)]*,\s*20\d\d[a-z]?\s*\)/g, '').trim();
        const model = name.replace(/\s*\(w\/ thinking\)/g, '').replace(/\s*\(\d+(?:\.\d+)?B\)/g, '').trim();
        const score = Number(r[2]);
        const match = licenses.find(l => l[1] === name && num(l.at(-2)) === score);
        const metrics: Record<string, number> = { passedLicenses: Number(r[3].split('/')[0]) };
        if (match) licenses[1].slice(2, -2).forEach((key, i) => {
          const value = num(match[i + 2]);
          if (value !== undefined) metrics[key] = value;
        });
        const size = name.match(/\((\d+(?:\.\d+)?)B\)/) ?? (!/Scout|Maverick/.test(name) ? name.match(/(?:^|[ -])(\d+(?:\.\d+)?)B\b/) : null);
        const prompt = prompts.find(p => p[0] === name && num(p[4]) === score);
        const mode = name.includes('(w/ thinking)') ? 'thinking' : 'paper default';
        const base = { model: uncertain(model), open, params: num(size?.[1]) };
        rows.push({ ...base, score, metrics, setting: 'zero-shot CoT; ' + (prompt ? 'English prompt' : 'paper-selected Korean/English prompt') + '; ' + mode });
        if (prompt && num(prompt[5]) !== undefined) {
          used.add(name);
          rows.push({ ...base, score: Number(prompt[5]), setting: 'zero-shot CoT; Korean prompt; ' + mode });
        }
      }
    }
    for (const p of prompts.slice(2)) {
      if (used.has(p[0]) || rows.some(r => r.model === uncertain(p[0]))) continue;
      for (const [index, language] of [[4, 'English'], [5, 'Korean']] as const) {
        const score = num(p[index]);
        if (score !== undefined) rows.push({ model: uncertain(p[0]), score, setting: 'zero-shot CoT; ' + language + ' prompt' });
      }
    }
    return checked(rows,3);
  },
};
export default board;
