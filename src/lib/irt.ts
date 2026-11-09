// A two-parameter item response model, fit to scores that models got on benchmarks. Each model has a capability
// (theta), and each benchmark a difficulty and a slope. The expected score of model m on benchmark b is
//   sigmoid(slope_b * (theta_m - difficulty_b))
// as a share of the room above chance. Epoch AI's Capabilities Index uses the same kind of model, which lets one
// scale place models that were tested on different benchmarks. This file has no data imports, so the tests in
// scripts/lib/irt.test.ts can run it on made-up scores.

/** One score: y is the share of the room above chance, from 0 to 1. */
export interface Obs {
  model: string;
  bench: string;
  y: number;
}

export interface Fit {
  models: string[];
  benches: string[];
  theta: Float64Array;
  difficulty: Float64Array;
  slope: Float64Array;
  /** Root mean square error of the fitted scores, as a share (0.08 is 8 points). */
  rmse: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * Fits capabilities, difficulties and slopes by least squares on the score scale, with Adam. A light penalty keeps
 * thetas and difficulties near zero and slopes near one, which pins the model's free shift and scale. Same input,
 * same output: it starts from zeros and has no randomness.
 */
export function fitIrt(obs: Obs[], { iters = 4000, lam = 1e-3, lr = 0.05 } = {}): Fit {
  const models = [...new Set(obs.map((o) => o.model))].sort();
  const benches = [...new Set(obs.map((o) => o.bench))].sort();
  const mi = new Map(models.map((m, i) => [m, i]));
  const bi = new Map(benches.map((b, i) => [b, i]));
  const I = Int32Array.from(obs, (o) => mi.get(o.model)!);
  const J = Int32Array.from(obs, (o) => bi.get(o.bench)!);
  const Y = Float64Array.from(obs, (o) => o.y);
  const nm = models.length;
  const nb = benches.length;
  const n = obs.length;

  // parameters, then their gradients and Adam moments, in one layout: theta | difficulty | log slope
  const size = nm + 2 * nb;
  const p = new Float64Array(size);
  const g = new Float64Array(size);
  const m1 = new Float64Array(size);
  const m2 = new Float64Array(size);
  const D = nm;
  const S = nm + nb;
  const b1 = 0.9;
  const b2 = 0.999;

  for (let t = 1; t <= iters; t++) {
    g.fill(0);
    for (let k = 0; k < n; k++) {
      const i = I[k];
      const j = J[k];
      const a = Math.exp(p[S + j]);
      const z = a * (p[i] - p[D + j]);
      const q = sigmoid(z);
      const e = (2 * (q - Y[k]) * q * (1 - q)) / n;
      g[i] += e * a;
      g[D + j] -= e * a;
      g[S + j] += e * z;
    }
    for (let i = 0; i < nm; i++) g[i] += (2 * lam * p[i]) / nm;
    for (let j = 0; j < nb; j++) {
      g[D + j] += (2 * lam * p[D + j]) / nb;
      g[S + j] += (20 * lam * p[S + j]) / nb;
    }
    const c1 = 1 - b1 ** t;
    const c2 = 1 - b2 ** t;
    for (let x = 0; x < size; x++) {
      m1[x] = b1 * m1[x] + (1 - b1) * g[x];
      m2[x] = b2 * m2[x] + (1 - b2) * g[x] * g[x];
      p[x] -= (lr * (m1[x] / c1)) / (Math.sqrt(m2[x] / c2) + 1e-9);
    }
  }

  const theta = p.slice(0, nm);
  const difficulty = p.slice(D, D + nb);
  const slope = p.slice(S, S + nb).map(Math.exp);
  let sq = 0;
  for (let k = 0; k < n; k++) sq += (sigmoid(slope[J[k]] * (theta[I[k]] - difficulty[J[k]])) - Y[k]) ** 2;
  return { models, benches, theta, difficulty, slope, rmse: Math.sqrt(sq / Math.max(1, n)) };
}

/** The fitted score of a model on a benchmark, as a share of the room above chance. */
export function predict(fit: Fit, model: string, bench: string): number | undefined {
  const i = fit.models.indexOf(model);
  const j = fit.benches.indexOf(bench);
  if (i < 0 || j < 0) return undefined;
  return sigmoid(fit.slope[j] * (fit.theta[i] - fit.difficulty[j]));
}

/** The theta that best fits one model's scores, with the benchmarks' parameters held fixed (Newton's method). */
export function solveTheta(diff: ArrayLike<number>, slope: ArrayLike<number>, ys: ArrayLike<number>, start: number): number {
  let t = start;
  for (let step = 0; step < 30; step++) {
    let grad = 0;
    let hess = 1e-6;
    for (let k = 0; k < ys.length; k++) {
      const q = sigmoid(slope[k] * (t - diff[k]));
      const w = slope[k] * q * (1 - q);
      grad += 2 * (q - ys[k]) * w;
      hess += 2 * w * w;
    }
    const move = grad / hess;
    t -= Math.max(-2, Math.min(2, move));
    if (Math.abs(move) < 1e-7) break;
  }
  return t;
}

/**
 * A 90% interval for each model's theta, from how precisely its own scores pin it down. Benchmarks near a model's
 * level tell the most, and saturated ones almost nothing, so a model whose scores sit near 100% gets a wide
 * interval. The noise is the model's own misfit, pulled toward the average misfit when it has few scores. The
 * interval covers which benchmarks the lab chose and how far its scores stray from the fit. It does not cover
 * differences in how labs ran the benchmarks.
 */
export function thetaIntervals(fit: Fit, obs: Obs[], { z = 1.645, prior = 5 } = {}): Map<string, { low: number; high: number }> {
  const mi = new Map(fit.models.map((m, i) => [m, i]));
  const bi = new Map(fit.benches.map((b, j) => [b, j]));
  const info = new Float64Array(fit.models.length);
  const sq = new Float64Array(fit.models.length);
  const n = new Float64Array(fit.models.length);
  let total = 0;
  for (const o of obs) {
    const i = mi.get(o.model);
    const j = bi.get(o.bench);
    if (i === undefined || j === undefined) continue;
    const q = sigmoid(fit.slope[j] * (fit.theta[i] - fit.difficulty[j]));
    info[i] += (fit.slope[j] * q * (1 - q)) ** 2;
    sq[i] += (q - o.y) ** 2;
    n[i]++;
    total += (q - o.y) ** 2;
  }
  const pooled = total / Math.max(1, obs.length);
  const out = new Map<string, { low: number; high: number }>();
  fit.models.forEach((m, i) => {
    const noise = Math.sqrt((sq[i] + prior * pooled) / (n[i] + prior));
    const half = (z * noise) / Math.sqrt(info[i] + 1e-9);
    out.set(m, { low: fit.theta[i] - half, high: fit.theta[i] + half });
  });
  return out;
}

/** Pearson correlation of two equal-length lists. */
export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let k = 0; k < n; k++) {
    sxy += (x[k] - mx) * (y[k] - my);
    sxx += (x[k] - mx) ** 2;
    syy += (y[k] - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy);
}

/** Spearman rank correlation: Pearson on ranks, with ties sharing their mean rank. */
export function spearman(x: number[], y: number[]): number {
  const ranks = (v: number[]) => {
    const order = v.map((val, i) => ({ val, i })).sort((a, b) => a.val - b.val);
    const r = new Array<number>(v.length);
    for (let k = 0; k < order.length; ) {
      let e = k;
      while (e + 1 < order.length && order[e + 1].val === order[k].val) e++;
      for (let z = k; z <= e; z++) r[order[z].i] = (k + e) / 2;
      k = e + 1;
    }
    return r;
  };
  return pearson(ranks(x), ranks(y));
}
