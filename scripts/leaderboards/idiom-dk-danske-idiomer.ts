// Idiom.dk scores Danish idiom questions by accuracy on the questions each model attempted.
// Read the benchmark data bundle as syntax and reconcile seven task breakdowns with the published model totals.
import type { Leaderboard } from './types.ts';
import ts from 'typescript';
import { fetchText } from '../lib/util.ts';
function field(node: ts.Node, name: string) {
  if (!ts.isObjectLiteralExpression(node)) throw new Error('Expected an Idiom.dk object');
  const property = node.properties.find(p => p.name?.getText() === name);
  if (!property || !ts.isPropertyAssignment(property)) throw new Error('Missing Idiom.dk field ' + name);
  return property.initializer;
}
function list(node: ts.Node, name: string) {
  const value = field(node, name);
  if (!ts.isArrayLiteralExpression(value)) throw new Error('Expected an Idiom.dk array ' + name);
  return value.elements;
}
function string(node: ts.Node, name: string) {
  const value = field(node, name);
  if (!ts.isStringLiteralLike(value)) throw new Error('Missing Idiom.dk string ' + name);
  return value.text;
}

const FEED = "https://www.idiom.dk/assets/benchmarkData-CBoc0Q3i.js";
const board: Leaderboard = {
  benchmark: "idiom-dk-danske-idiomer",
  url: "https://www.idiom.dk/da/benchmark",
  feed: FEED,
  terms: "Reference only. The terms prohibit automated extraction and require written permission for commercial reuse. The board uses different denominators for text and vision models. https://www.idiom.dk/da/vilkaar The general robots rules allow the benchmark page.",
  parts: { mc: 'Multiple Choice', fillblank: 'Fill in the Blanks', 'definition-writing': 'Definition Writing', translation: 'Translation', context: 'Context', match: 'Match', image: 'Image' },
  stats: {
    total: { name: 'Questions attempted', unit: 'count' },
    correct: { name: 'Questions correct', unit: 'count' },
    skipped: { name: 'Questions skipped', unit: 'count' },
  },
  async fetch() {
    const file = ts.createSourceFile('data.js', await fetchText(FEED), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const initializers = file.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations].map(d => d.initializer));
    const data = initializers.find(n => n && ts.isObjectLiteralExpression(n) && n.properties.some(p => p.name?.getText() === 'model_summary'));
    if (!data) throw new Error('Missing Idiom.dk benchmark data');
    const questions = list(data, 'questions'), summary = list(data, 'model_summary');
    if (questions.length < 200 || summary.length < 20) throw new Error('Incomplete Idiom.dk benchmark');
    const counts = new Map<string, Record<string, { correct: number; total: number }>>();
    for (const q of questions) {
      const part = string(q, 'type');
      for (const a of list(q, 'model_answers')) {
        const model = string(a, 'model');
        const stats = counts.get(model) ?? {};
        const values = stats[part] ??= { correct: 0, total: 0 };
        const flag = field(a, 'correct').getText();
        if (!['!0','!1'].includes(flag)) throw new Error('Unknown correctness flag');
        values.correct += Number(flag === '!0');
        values.total++;
        counts.set(model, stats);
      }
    }
    return summary.map(r => {
      const model = string(r, 'model_name'), score = Number(field(r, 'accuracy').getText());
      const total = Number(field(r, 'total').getText()), correct = Number(field(r, 'correct').getText());
      const stats = Object.entries(counts.get(model) ?? {});
      if (!Number.isFinite(score) || stats.reduce((s,[,v]) => s + v.total, 0) !== total || stats.reduce((s,[,v]) => s + v.correct, 0) !== correct) throw new Error('Idiom totals differ for ' + model);
      return { model, score, metrics: { total, correct, skipped: Number(field(r, 'skipped').getText()),
        ...Object.fromEntries(stats.map(([k,v]) => [k, 100 * v.correct / v.total])) } };
    });
  },
};
export default board;
