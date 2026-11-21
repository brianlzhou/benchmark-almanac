// Olam Labs' Multi-Agent Arena, Diplomacy: seven players, people or anonymized models, negotiate and fight over
// World War I Europe (the arena's own version, "Great Powers"). The board ranks models by their mean share of the
// sum-of-squares score (each player's supply centers squared, over the table's total), where 14.3 is an even split
// among seven powers. Its behavior charts are graded by a model judge from each agent's transcript (Olam Labs'
// Diplomacy post, 2026-09-25): how often a model breaks its promises to allies (lower is better on the board), how
// often it believes false promises and suffers for it ("gullibility"), and the share of promises made to it that it
// believed ("skepticism"). Read through olam-arena.ts, which says which charts the overview shows.
import type { Leaderboard } from './types.ts';
import { OLAM_HARNESS, OLAM_PAGE, OLAM_TERMS, olamRows } from './olam-arena.ts';

const board: Leaderboard = {
  benchmark: 'olam-arena-diplomacy',
  url: `${OLAM_PAGE}#greatpowers`,
  feed: `${OLAM_PAGE} (the Diplomacy charts in the page's HTML)`,
  terms: OLAM_TERMS,
  ...OLAM_HARNESS,
  stats: {
    brokenPromiseRate: { name: 'Broken promise rate', unit: '%', better: 'lower', note: 'How often the model breaks its promises to allies, graded from its transcript.' },
    gullibility: { name: 'Gullibility', unit: '%', better: 'lower', note: 'How often the model believes a false promise and suffers for it.' },
    skepticism: { name: 'Skepticism', unit: '%', note: 'The share of promises made to the model that it believed. Olam Labs calls neither direction better.' },
  },
  chart: {
    title: 'Share vs. broken promises',
    x: { key: 'brokenPromiseRate', label: 'Broken promise rate', unit: '%', better: 'lower' },
    y: { key: 'score', label: 'Mean SoS share', unit: '%', better: 'higher' },
    note: 'Olam Labs plots each model’s share of the score against the share of its promises that it broke.',
  },
  fetch: () => olamRows('greatpowers-sos', { brokenPromiseRate: 'greatpowers-broken-promises', gullibility: 'greatpowers-gullibility', skepticism: 'greatpowers-skepticism' }),
};
export default board;
