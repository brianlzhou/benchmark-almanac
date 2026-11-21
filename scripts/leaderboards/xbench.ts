// Xbench's default Firsthand stance board ranks models by net sentiment.
// The published net_sentiment is a signed fraction. Scores use percentage points, including negative values.
// The importer reads the maker's public summary only. It never requests X or Twitter hosts.
// Harness sentiment and per-week results are separate views, not additional rows.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://media.offpolicyinc.com/xbench/data/labels-v3/public-summary.json?v=2026-09-28a";
const board: Leaderboard = {
  benchmark: "xbench",
  url: "https://offpolicyinc.com/work/xbench/app/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  stats: {
    votes: {name: 'Firsthand votes', unit: 'count'},
    positive: {name: 'Firsthand positive votes', unit: 'count'},
    negative: {name: 'Firsthand negative votes', unit: 'count'},
    mixed: {name: 'Firsthand mixed votes', unit: 'count'},
    allExpressed: {name: 'All expressed net sentiment', unit: '%', better: 'higher'},
    allExpressedVotes: {name: 'All expressed votes', unit: 'count'},
    allExpressedPositive: {name: 'All expressed positive votes', unit: 'count'},
    allExpressedNegative: {name: 'All expressed negative votes', unit: 'count'},
    allExpressedMixed: {name: 'All expressed mixed votes', unit: 'count'},
    endorsements: {name: 'Endorsement net sentiment', unit: '%', better: 'higher'},
    endorsementsVotes: {name: 'Endorsement votes', unit: 'count'},
    endorsementsPositive: {name: 'Endorsement positive votes', unit: 'count'},
    endorsementsNegative: {name: 'Endorsement negative votes', unit: 'count'},
    endorsementsMixed: {name: 'Endorsement mixed votes', unit: 'count'},
    dimensionIntelligenceVotes: {name: 'Intelligence votes', unit: 'count'},
    dimensionIntelligencePositive: {name: 'Intelligence positive votes', unit: 'count'},
    dimensionIntelligenceNegative: {name: 'Intelligence negative votes', unit: 'count'},
    dimensionIntelligenceMixed: {name: 'Intelligence mixed votes', unit: 'count'},
    dimensionSpeedVotes: {name: 'Speed votes', unit: 'count'},
    dimensionSpeedPositive: {name: 'Speed positive votes', unit: 'count'},
    dimensionSpeedNegative: {name: 'Speed negative votes', unit: 'count'},
    dimensionSpeedMixed: {name: 'Speed mixed votes', unit: 'count'},
    dimensionPriceVotes: {name: 'Price votes', unit: 'count'},
    dimensionPricePositive: {name: 'Price positive votes', unit: 'count'},
    dimensionPriceNegative: {name: 'Price negative votes', unit: 'count'},
    dimensionPriceMixed: {name: 'Price mixed votes', unit: 'count'},
    dimensionSteerabilityVotes: {name: 'Steerability votes', unit: 'count'},
    dimensionSteerabilityPositive: {name: 'Steerability positive votes', unit: 'count'},
    dimensionSteerabilityNegative: {name: 'Steerability negative votes', unit: 'count'},
    dimensionSteerabilityMixed: {name: 'Steerability mixed votes', unit: 'count'},
    dimensionPersonalityVotes: {name: 'Personality votes', unit: 'count'},
    dimensionPersonalityPositive: {name: 'Personality positive votes', unit: 'count'},
    dimensionPersonalityNegative: {name: 'Personality negative votes', unit: 'count'},
    dimensionPersonalityMixed: {name: 'Personality mixed votes', unit: 'count'},
    dimensionOverallVotes: {name: 'Overall votes', unit: 'count'},
    dimensionOverallPositive: {name: 'Overall positive votes', unit: 'count'},
    dimensionOverallNegative: {name: 'Overall negative votes', unit: 'count'},
    dimensionOtherVotes: {name: 'Other votes', unit: 'count'},
    dimensionOtherPositive: {name: 'Other positive votes', unit: 'count'},
    dimensionOtherNegative: {name: 'Other negative votes', unit: 'count'},
    dimensionOtherMixed: {name: 'Other mixed votes', unit: 'count'},
    week1Votes: {name: 'Week 1 votes', unit: 'count'},
    week1Positive: {name: 'Week 1 positive votes', unit: 'count'},
    week1Negative: {name: 'Week 1 negative votes', unit: 'count'},
    week1Mixed: {name: 'Week 1 mixed votes', unit: 'count'},
    week2Votes: {name: 'Week 2 votes', unit: 'count'},
    week2Positive: {name: 'Week 2 positive votes', unit: 'count'},
    week2Negative: {name: 'Week 2 negative votes', unit: 'count'},
    week2Mixed: {name: 'Week 2 mixed votes', unit: 'count'},
    costMentions: {name: 'Cost mentions', unit: 'count'},
    codingMentions: {name: 'Coding mentions', unit: 'count'},
    noneMentions: {name: 'No preference mentions', unit: 'count'},
    agentsMentions: {name: 'Agent mentions', unit: 'count'},
    writingMentions: {name: 'Writing mentions', unit: 'count'},
    chatMentions: {name: 'Chat mentions', unit: 'count'},
    multimodalMentions: {name: 'Multimodal mentions', unit: 'count'},
  },
  
  async fetch() {
    const d=await fetchJson(FEED) as any;
    if(!Array.isArray(d.sentiment?.models))throw new Error('Missing model sentiment');
    board.parts = {};
    type Counts = {n:number;positive:number;negative:number;mixed:number;net_sentiment:number|null};
    return d.sentiment.models.filter((r:any)=>r.firsthand?.n>0 && typeof r.firsthand.net_sentiment==='number').map((r:any)=>{
      const metrics:Record<string,number> = {votes:r.firsthand.n,positive:r.firsthand.positive,negative:r.firsthand.negative,mixed:r.firsthand.mixed};
      const add = (key:string, counts:Counts) => {
        if (!counts?.n || typeof counts.net_sentiment !== 'number') return;
        metrics[key] = counts.net_sentiment * 100;
        metrics[key+'Votes'] = counts.n;
        metrics[key+'Positive'] = counts.positive;
        metrics[key+'Negative'] = counts.negative;
        metrics[key+'Mixed'] = counts.mixed;
      };
      add('allExpressed', r.all_expressed);
      add('endorsements', r.endorsements);
      for (const [name, counts] of Object.entries(r.dimensions ?? {}) as [string,Counts][]) {
        const key = 'dimension' + name[0].toUpperCase() + name.slice(1);
        add(key, counts);
        if (key in metrics) board.parts![key] = {name,group:'Dimension'};
      }
      for (const week of d.window.weeks ?? []) {
        const key = 'week' + week.id.replace(/^w/,'');
        add(key, r.by_window?.[week.id]);
        if (key in metrics) board.parts![key] = {name:String(week.label).replace(/\s*[–—-]\s*/g, ' to '),group:'Week'};
      }
      for (const [name,count] of Object.entries(r.tasks ?? {})) {
        if (typeof count === 'number') metrics[name+'Mentions'] = count;
      }
      return {model:r.model,score:r.firsthand.net_sentiment*100,date:d.window.end.slice(0,10),metrics};
    });
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
