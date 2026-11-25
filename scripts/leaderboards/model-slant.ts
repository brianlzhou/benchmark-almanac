// Model Slant measures perceived partisan slant. The dashboard's default rank uses the magnitude of average slant.
// We retain the signed ratings and the percentage of judgments that detected slant as separate measurements.
// The same absolute rating for each topic gives the topic-level scores.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

interface Rating { average_slant:number;democrat_slant:number;republican_slant:number;percent_slanted:number }
const topics = [
  'All Topics', 'Affirmative Action', 'Authoritarian Reform', 'Birthright Citizenship', 'Campaign Finance',
  'Child Labor Laws', 'Climate Policy', 'Death Penalty', 'Defund the Police', 'DEI Programs',
  'Electoral College', 'Europe Ally', 'Expansionism', 'Firing Government Workers', 'Free Speech',
  'Gay Conversion', 'Gov. Control Colleges', 'Gun Control', 'Health Care', 'Mass Deportations',
  'Minimum Wage', 'National Religion', 'PC Language', 'Russia Ally', 'School Vouchers',
  'Student Loan Debt', 'Tariffs', 'Taxes on Wealthy', 'Trans Rights', 'Unions', 'Universal Basic Income (UBI)',
];
const slantStats = Object.fromEntries(topics.flatMap(topic => {
  const key = topic === 'All Topics' ? '' : topic.replace(/[^a-z0-9]+/gi, '_');
  const prefix = topic === 'All Topics' ? '' : topic + ': ';
  return [
    [key + 'SignedSlant', { name: prefix + 'Signed slant', unit: 'score', note: 'Negative leans Democratic and positive leans Republican, with 0 neutral.' }],
    [key + 'PercentSlanted', { name: prefix + 'Slanted responses', unit: '%', better: 'lower' as const }],
    [key + 'DemocratSlant', { name: prefix + 'Perceived slant among Democrats', unit: 'score' }],
    [key + 'RepublicanSlant', { name: prefix + 'Perceived slant among Republicans', unit: 'score' }],
  ];
}));
const feed = 'https://modelslant.com/output_models.json';
const board: Leaderboard = {
  benchmark:'model-slant',url:'https://modelslant.com/',feed,
  stats: slantStats,
  aliases: { 'mistral-large-2402':'mistral-large', 'nova-pro':'amazon-nova-pro', 'nova-micro':'amazon-nova-micro' },
  terms:'The Polarization Research Lab publishes the data and terms at https://modelslant.com/data.html',
  async fetch() {
    const data = await fetchJson<{meta:{models:number;topics:number};models:{name:string;topics:Record<string,Rating>}[]}>(feed);
    if (data.meta.models !== data.models.length || data.meta.models < 2) throw new Error('Incomplete Model Slant data');
    const parts: Record<string, BoardPart> = {};
    const rows = data.models.map(({name,topics}) => {
      if (!topics['All Topics'] || Object.keys(topics).length !== data.meta.topics + 1) throw new Error('Missing topic scores for '+name);
      const metrics: Record<string,number> = {};
      for (const [topic,rating] of Object.entries(topics)) {
        const key = topic === 'All Topics' ? '' : topic.replace(/[^a-z0-9]+/gi,'_');
        if (key) {
          parts[key] = {name:topic,unit:'score',better:'lower'};
          metrics[key] = Math.abs(rating.average_slant);
        }
        metrics[key+'SignedSlant'] = rating.average_slant;
        metrics[key+'PercentSlanted'] = rating.percent_slanted;
        metrics[key+'DemocratSlant'] = rating.democrat_slant;
        metrics[key+'RepublicanSlant'] = rating.republican_slant;
      }
      if (!Object.values(metrics).every(Number.isFinite)) throw new Error('Non-numeric Model Slant rating for '+name);
      return {model:name,score:Math.abs(topics['All Topics'].average_slant),metrics};
    });
    board.parts = parts;
    return checked(rows,data.meta.models);
  },
};
export default board;
