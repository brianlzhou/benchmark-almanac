// The site's one name and one description. The description is the home page's subtitle, with live counts, and
// every page that has no description of its own uses it. The README's first line and package.json say the same
// thing without the counts. Change them together.
import { benchmarks, cards, systemCards, LEADERBOARDS } from './data.ts';
import githubJson from '../../data/github.json';

const n = (v: number) => v.toLocaleString('en-US');
export const SITE_NAME = 'Benchmark Almanac';
export const SITE_DESCRIPTION = `We track ${n(benchmarks.length)} benchmarks from ${n(Object.keys(LEADERBOARDS).length)} public leaderboards, ${n(cards.length)} launch posts, ${n(systemCards.length)} system cards, and ${n(Object.keys(githubJson).length)} open-source GitHub repositories.`;
/** The home page's DataCatalog, which every benchmark's Dataset names as its catalog. */
export const CATALOG_ID = '#catalog';
