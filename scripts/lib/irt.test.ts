// Tests for the item response fit behind the Self-Reported Index (src/lib/irt.ts), on made-up scores where the
// true capabilities are known. Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitIrt, thetaIntervals, predict, spearman, pearson, type Obs } from '../../src/lib/irt.ts';

// a seeded generator, so the made-up data is the same on every run
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rand = rng(7);
const normal = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const truth = { theta: new Map<string, number>(), diff: new Map<string, number>(), slope: new Map<string, number>() };
for (let i = 0; i < 80; i++) truth.theta.set(`m${i}`, rand() * 4 - 2);
for (let j = 0; j < 30; j++) {
  truth.diff.set(`b${j}`, rand() * 4 - 2);
  truth.slope.set(`b${j}`, 0.6 + rand() * 1.4);
}
// each model reports about 40% of the benchmarks, with noise of about 5 points
const all: Obs[] = [];
for (const [m, t] of truth.theta)
  for (const [b, d] of truth.diff)
    if (rand() < 0.4) all.push({ model: m, bench: b, y: Math.min(1, Math.max(0, sigmoid(truth.slope.get(b)! * (t - d)) + 0.05 * normal())) });

test('the fit recovers the order of the true capabilities', () => {
  const fit = fitIrt(all);
  const est = fit.models.map((_, i) => fit.theta[i]);
  const real = fit.models.map((m) => truth.theta.get(m)!);
  assert.ok(spearman(est, real) > 0.95, `spearman ${spearman(est, real)}`);
  assert.ok(pearson(fit.benches.map((_, j) => fit.difficulty[j]), fit.benches.map((b) => truth.diff.get(b)!)) > 0.9);
  assert.ok(fit.rmse < 0.07, `rmse ${fit.rmse}`);
});

test('the same scores give the same fit', () => {
  const a = fitIrt(all, { iters: 500 });
  const b = fitIrt(all, { iters: 500 });
  assert.deepEqual([...a.theta], [...b.theta]);
});

test('held-out scores are predicted better than by each benchmark average', () => {
  const train = all.filter((_, k) => k % 5 !== 0);
  const test = all.filter((_, k) => k % 5 === 0);
  const fit = fitIrt(train, { iters: 2500 });
  const avg = new Map<string, number[]>();
  for (const o of train) avg.set(o.bench, [...(avg.get(o.bench) ?? []), o.y]);
  let e = 0;
  let base = 0;
  for (const o of test) {
    e += (predict(fit, o.model, o.bench)! - o.y) ** 2;
    const xs = avg.get(o.bench)!;
    base += (xs.reduce((s, v) => s + v, 0) / xs.length - o.y) ** 2;
  }
  assert.ok(e < base / 3, `fit ${e} vs average ${base}`);
});

test('the 90% intervals cover the true capability about nine times in ten, and widen with fewer scores', () => {
  const fit = fitIrt(all);
  const ci = thetaIntervals(fit, all);
  const n = new Map<string, number>();
  for (const o of all) n.set(o.model, (n.get(o.model) ?? 0) + 1);
  // the fit's scale is free up to a shift and a stretch, so line it up with the truth before checking
  const est = fit.models.map((_, i) => fit.theta[i]);
  const real = fit.models.map((m) => truth.theta.get(m)!);
  const me = est.reduce((s, v) => s + v, 0) / est.length;
  const mr = real.reduce((s, v) => s + v, 0) / real.length;
  const k = est.reduce((s, v, i) => s + (v - me) * (real[i] - mr), 0) / est.reduce((s, v) => s + (v - me) ** 2, 0);
  const inside = fit.models.filter((m, i) => {
    const iv = ci.get(m)!;
    const lo = mr + k * (iv.low - me);
    const hi = mr + k * (iv.high - me);
    return lo <= real[i] && real[i] <= hi;
  }).length;
  assert.ok(inside / fit.models.length > 0.8 && inside / fit.models.length < 0.99, `coverage ${inside / fit.models.length}`);
  const width = (pick: (c: number) => boolean) => {
    const w = fit.models.filter((m) => pick(n.get(m)!)).map((m) => ci.get(m)!.high - ci.get(m)!.low).sort((a, b) => a - b);
    return w[Math.floor(w.length / 2)];
  };
  assert.ok(width((c) => c <= 9) > width((c) => c >= 15), `few ${width((c) => c <= 9)} vs many ${width((c) => c >= 15)}`);
});
