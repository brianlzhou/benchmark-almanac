// ChemCoTBench tests stepwise chemical reasoning across 1,495 examples in 22 subtasks covering molecule
// understanding, molecule editing, molecule optimization and reaction prediction.
// The makers' site publishes three tables with mixed units and directions (MAE, Tanimoto similarity,
// property deltas, Top-1 accuracy and percentages) and no single overall score across all three tables.
// This importer reads all three tables on the ChemCoTBench project page, using SMILES Equivalence (Eq.)
// from the first table as the headline score and joining all 30 other columns across the three tables
// into metrics and parts by model and thinking mode.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://howardli1984.github.io/ChemCoTBench.github.io/';

const PARTS: Record<string, BoardPart> = {
  fg: { name: 'Functional Group MAE', group: 'Molecule Understanding', unit: 'score', better: 'lower', note: 'Mean absolute error on functional group counting.' },
  ring: { name: 'Ring Count MAE', group: 'Molecule Understanding', unit: 'score', better: 'lower', note: 'Mean absolute error on ring counting.' },
  murcko: { name: 'Murcko Scaffold', group: 'Molecule Understanding', unit: 'score', better: 'higher', note: 'Tanimoto similarity on Murcko scaffold extraction from 0 to 1.' },
  ringSys: { name: 'Ring System', group: 'Molecule Understanding', unit: '%', better: 'higher' },
  editAdd: { name: 'Add', group: 'Molecule Editing', unit: '%', better: 'higher' },
  editDelete: { name: 'Delete', group: 'Molecule Editing', unit: '%', better: 'higher' },
  editSub: { name: 'Substitute', group: 'Molecule Editing', unit: '%', better: 'higher' },
  optLogPDelta: { name: 'LogP delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optLogPSr: { name: 'LogP success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  optSolDelta: { name: 'Solubility delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optSolSr: { name: 'Solubility success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  optQedDelta: { name: 'QED delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optQedSr: { name: 'QED success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  optDrd2Delta: { name: 'DRD2 delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optDrd2Sr: { name: 'DRD2 success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  optJnk3Delta: { name: 'JNK3 delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optJnk3Sr: { name: 'JNK3 success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  optGsk3bDelta: { name: 'GSK3-beta delta', group: 'Molecule Optimization', unit: 'score', better: 'higher' },
  optGsk3bSr: { name: 'GSK3-beta success rate', group: 'Molecule Optimization', unit: '%', better: 'higher' },
  rxnFwdMajorTop1: { name: 'Forward major Top-1', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Top-1 exact match rate from 0 to 1.' },
  rxnFwdMajorFts: { name: 'Forward major FTS', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Fingerprint Tanimoto similarity from 0 to 1.' },
  rxnFwdByTop1: { name: 'Forward byproduct Top-1', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Top-1 exact match rate from 0 to 1.' },
  rxnFwdByFts: { name: 'Forward byproduct FTS', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Fingerprint Tanimoto similarity from 0 to 1.' },
  rxnRetroTop1: { name: 'Retrosynthesis Top-1', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Top-1 exact match rate from 0 to 1.' },
  rxnRetroFts: { name: 'Retrosynthesis FTS', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Fingerprint Tanimoto similarity from 0 to 1.' },
  rxnCondTop1: { name: 'Condition Top-1', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Top-1 exact match rate from 0 to 1.' },
  rxnCondFts: { name: 'Condition FTS', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Fingerprint Tanimoto similarity from 0 to 1.' },
  rxnNeppTop1: { name: 'NEPP Top-1', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Top-1 exact match rate from 0 to 1.' },
  rxnNeppFts: { name: 'NEPP FTS', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Fingerprint Tanimoto similarity from 0 to 1.' },
  rxnMechSel: { name: 'Mechanism Selection', group: 'Reaction Prediction', unit: 'score', better: 'higher', note: 'Accuracy from 0 to 1.' },
};

const parseNum = (s: string, label: string): number => {
  const clean = s.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(clean)) throw new Error(`ChemCoTBench invalid number for ${label}: "${s}"`);
  return Number(clean);
};

// Normalize model names across the three HTML tables so Table 1 and Table 2 join cleanly onto Table 0.
const joinKey = (name: string, mode: string): string => {
  const base = name
    .replace(/-think$/i, '')
    .replace(/@\d+$/i, '')
    .replace(/^Llama-Nemo-Super-49B$/i, 'Llama-Nemo-49B')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${base}|${mode}`;
};

const modelName = (name: string, version: string): string => {
  if (name === 'GPT-4o' && version === '20241120') return 'gpt-4o-2024-11-20';
  if (name === 'o1-mini' && version === '20240912') return 'o1-mini-2024-09-12';
  if (/^Gemini-2\.5-pro$/i.test(name)) return 'Gemini 2.5 Pro (snapshot unspecified)';
  if (/^Gemini-2\.0-flash$/i.test(name)) return 'Gemini 2.0 Flash (snapshot unspecified)';
  if (/^DeepSeek-R1$/i.test(name)) return 'DeepSeek-R1 (snapshot unspecified)';
  if (/^Deepseek-V3$/i.test(name)) return 'DeepSeek-V3 (snapshot unspecified)';
  return name;
};

const board: Leaderboard = {
  benchmark: 'chemcotbench',
  url: `${URL}#leaderboard`,
  feed: URL,
  terms: 'The ChemCoTBench authors publish the benchmark and project leaderboard under the MIT license at https://github.com/IDEA-XL/ChemCoTBench.',
  headline: 'ChemCoTBench reports 31 metrics across three tables without an overall score, so this is the SMILES Equivalence (Eq.) score from its first table.',
  aliases: {
    'Claude3.7-sonnet': 'claude-3-7-sonnet',
    'Llama-Nemo-49B': 'llama-3-3-nemotron-super-49b-v1',
    'OLMo2-32B-Instruct': 'olmo-2-32b-instruct',
    'Phi-4-14B': 'phi-4',
  },
  parts: PARTS,
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = tables(await fetchText(URL));
    if (ts.length < 3) throw new Error(`ChemCoTBench expected 3 leaderboard tables, found ${ts.length}`);
    const [t0, t1, t2] = ts;
    if (t0[1]?.[0]?.text !== 'Name' || t0[1]?.[7]?.text !== 'Eq.↑') throw new Error('ChemCoTBench Table 0 columns changed');
    if (t1[0]?.[1]?.text !== 'LogP' || t1[1]?.[1]?.text !== 'SR%') throw new Error('ChemCoTBench Table 1 columns changed');
    if (t2[1]?.[0]?.text !== 'Name' || t2[1]?.[13]?.text !== 'Acc.↑') throw new Error('ChemCoTBench Table 2 columns changed');

    // Parse Table 1 (Molecule Optimization)
    const optMap = new Map<string, Record<string, number>>();
    let mode1 = 'think';
    const optKeys = [
      'optLogPDelta', 'optLogPSr', 'optSolDelta', 'optSolSr', 'optQedDelta', 'optQedSr',
      'optDrd2Delta', 'optDrd2Sr', 'optJnk3Delta', 'optJnk3Sr', 'optGsk3bDelta', 'optGsk3bSr',
    ];
    for (const r of t1.slice(2)) {
      if (r.length === 1) {
        if (/W\/\s*Thinking/i.test(r[0].text)) mode1 = 'think';
        else if (/W\/o\s*Thinking/i.test(r[0].text)) mode1 = 'base';
        continue;
      }
      if (r.length !== 13) throw new Error(`ChemCoTBench Table 1 unexpected row length ${r.length}`);
      const k = joinKey(r[0].text, mode1);
      const m: Record<string, number> = {};
      optKeys.forEach((mk, i) => {
        m[mk] = parseNum(r[i + 1].text, `${r[0].text} ${mk}`);
      });
      optMap.set(k, m);
    }

    // Parse Table 2 (Reaction Prediction)
    const rxnMap = new Map<string, Record<string, number>>();
    const rxnKeys = [
      'rxnFwdMajorTop1', 'rxnFwdMajorFts', 'rxnFwdByTop1', 'rxnFwdByFts',
      'rxnRetroTop1', 'rxnRetroFts', 'rxnCondTop1', 'rxnCondFts',
      'rxnNeppTop1', 'rxnNeppFts', 'rxnMechSel',
    ];
    for (const r of t2.slice(2)) {
      if (r.length === 1) continue;
      if (r.length !== 14) throw new Error(`ChemCoTBench Table 2 unexpected row length ${r.length}`);
      const mode = r[1].text.toLowerCase() === 'think' ? 'think' : 'base';
      const k = joinKey(r[0].text, mode);
      const m: Record<string, number> = {};
      rxnKeys.forEach((mk, i) => {
        m[mk] = parseNum(r[i + 3].text, `${r[0].text} ${mk}`);
      });
      rxnMap.set(k, m);
    }

    // Parse Table 0 (Molecule Understanding & Editing) and join Table 1 + Table 2
    const rows: LeaderboardRow[] = [];
    for (const r of t0.slice(2)) {
      if (r.length === 1) continue;
      if (r.length !== 11) throw new Error(`ChemCoTBench Table 0 unexpected row length ${r.length}`);
      const rawName = r[0].text.trim();
      const type = r[1].text.trim().toLowerCase();
      const version = r[2].text.trim();
      const mode = type === 'think' ? 'think' : 'base';
      const k = joinKey(rawName, mode);

      const metrics: Record<string, number> = {
        fg: parseNum(r[3].text, `${rawName} fg`),
        ring: parseNum(r[4].text, `${rawName} ring`),
        murcko: parseNum(r[5].text, `${rawName} murcko`),
        ringSys: parseNum(r[6].text, `${rawName} ringSys`),
        editAdd: parseNum(r[8].text, `${rawName} editAdd`),
        editDelete: parseNum(r[9].text, `${rawName} editDelete`),
        editSub: parseNum(r[10].text, `${rawName} editSub`),
      };
      const opt = optMap.get(k);
      if (opt) Object.assign(metrics, opt);
      const rxn = rxnMap.get(k);
      if (rxn) Object.assign(metrics, rxn);

      rows.push({
        model: modelName(rawName, version),
        setting: type === 'think' ? 'thinking' : 'non-thinking',
        score: parseNum(r[7].text, `${rawName} Eq.`),
        metrics,
      });
    }

    return checked(rows, 22);
  },
};

export default board;
