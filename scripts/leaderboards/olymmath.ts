// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// OlymMATH tests olympiad math in Chinese and English. Tables 9 and 10 report pass@1 and consensus accuracy by difficulty and subject.
// Section 4.1.1 defines pass@1 as "mean accuracy across all sampled responses" and lists the six models sampled eight times.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2503.21380';
const subjects = ['Algebra','Geometry','Number theory','Combinatorics','Average'];
const eightTrials = new Set(['OpenMath-Nemo. (32B)','Qwen3 (235B-A22B, Think)','GLM-Z1-Air (32B)',
  'DeepSeek R1','OpenAI o3-mini (high)','Gemini 2.5 Pro Exp 0325']);
const board: Leaderboard = {
  benchmark: 'olymmath', static: 'paper', url: 'https://github.com/RUCAIBox/OlymMATH', feed,
  terms: PAPER_TERMS + ' https://arxiv.org/abs/2503.21380',
  headline: 'The headline is the plain mean of English easy, English hard, Chinese easy and Chinese hard pass@1.',
  aliases: { 'Gemini 2.5 Pro Exp 0325':'gemini-2-5-pro-mar-2025','GLM-Z1-Air (32B)':'glm-z1-32b-0414','QwQ (32B)':'qwq-32b',
    ...Object.fromEntries(['1.5','7','14','32'].map(n=>['DS-R1-Distill ('+n+'B)','deepseek-r1-distill-qwen-'+n.replace('.','-')+'b'])),
    'Qwen3 (0.6B)': 'qwen3-0-6b', 'Qwen3 (4B)': 'qwen3-4b',
    'Qwen3 (30B-A3B)': 'qwen3-30b-a3b', 'Qwen3 (235B-A22B)': 'qwen3-235b-a22b',
    'DeepSeek R1 (snapshot unspecified)': 'deepseek-r1',
  },
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[\s\S]*?<\/figure>/gi)];
    const rows = new Map<string,LeaderboardRow>(), parts: Record<string,BoardPart> = {};
    for (const lang of ['EN','ZH']) {
      const figure = figures.find(f=>f[0].includes('performance on OlymMATH ('+lang+')'));
      const t = figure && inlinePaperTables(figure[0]).find(t=>t[0]?.[1] === 'OlymMATH-HARD ('+lang+')');
      if (!t || t[0][11] !== 'OlymMATH-EASY ('+lang+')' || t[2].slice(1).join('|') !== Array(10).fill('P@1|C@k').join('|') ||
          t[1].slice(1).join('|') !== Array(2).fill('Alg.|Alg.|Geo.|Geo.|Num.|Num.|Com.|Com.|Avg.|Avg.').join('|')) {
        throw new Error('Missing OlymMATH appendix columns: ' + lang);
      }
      for (const [label,...cells] of t.slice(3)) {
        if (cells.length !== 20) throw new Error('Incomplete OlymMATH row');
        const model = label.replace(', Think)',')').replace('OpenAI o3-mini (high)','o3-mini');
        const row = rows.get(label) ?? { model, score:0, metrics:{}, trials:eightTrials.has(label) ? 8 : 64,
          setting:label.includes('Think)') ? 'Thinking' : label.includes('(high)') ? 'High reasoning effort' : undefined };
        const metrics: Record<string,number> = row.metrics!;
        for (const [d,level] of ['Hard','Easy'].entries()) {
          const group = (lang === 'EN' ? 'English ' : 'Chinese ') + level.toLowerCase();
          for (const [j,subject] of subjects.entries()) {
            const key = lang+level+(j < 4 ? subject.replace(' ','') : '');
            parts[key] = {name: j < 4 ? subject : group, group: j < 4 ? group : 'Language and difficulty'};
            metrics[key] = numberCell(cells[d*10+j*2]);
            metrics[key+'Consensus'] = numberCell(cells[d*10+j*2+1]);
          }
        }
        rows.set(label,row);
      }
    }
    board.parts = parts;
    for (const row of rows.values()) {
      const m = row.metrics!;
      row.score = (m.ENHard + m.ENEasy + m.ZHHard + m.ZHEasy)/4;
    }
    return checked([...rows.values()],28);
  },
};
export default board;
