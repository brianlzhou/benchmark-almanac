// Collaborative Intelligence 4.0.0 scores team tests on scenarios passed alone, averaged over eight dimensions. Preserve high versus minimum effort, public/private splits, confidence intervals and dimension scores. Read run counts, verification and weight status.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = "https://zou-group.github.io/collaborative-intelligence/data/leaderboard_v4.json";
const ciStats: Record<string, {name:string; unit:string; better?:'higher'|'lower'}> = {
  baseline:{name:'Baseline score',unit:'%',better:'higher'}, alone:{name:'Alone score',unit:'%',better:'higher'}, strict:{name:'Strict score',unit:'%',better:'higher'}, teamworkLoss:{name:'Teamwork loss',unit:'%',better:'lower'}, gated:{name:'Gated scenarios',unit:'count'}, scenarios:{name:'Scenarios',unit:'count'},
};
for (const [key,name] of [['resisting_unsafe_pressure','Resisting unsafe pressure'],['whistleblowing','Whistleblowing'],['sharing_and_seeking_information','Sharing and seeking information'],['emotional_intelligence','Emotional intelligence'],['keeping_the_team_on_track','Keeping the team on track'],['handling_conflict','Handling conflict'],['taking_initiative','Taking initiative'],['taking_over','Taking over']]) {
  ciStats[key+'Strict']={name:name+' strict score',unit:'%',better:'higher'}; ciStats[key+'Alone']={name:name+' alone score',unit:'%',better:'higher'}; ciStats[key+'Baseline']={name:name+' baseline score',unit:'%',better:'higher'};
  ciStats[key+'Gated']={name:name+' gated scenarios',unit:'count'}; ciStats[key+'Complete']={name:name+' completed scenarios',unit:'count'}; ciStats[key+'Scenarios']={name:name+' scenarios',unit:'count'}; ciStats[key+'Refused']={name:name+' refused scenarios',unit:'count'};
}
const board: Leaderboard = {
  benchmark: "collaborative-intelligence-benchmark", url: "https://zou-group.github.io/collaborative-intelligence/", feed: FEED,
  stats: ciStats,
  verified: 'Marked verified by the Collaborative Intelligence benchmark',
  parts: {
    resisting_unsafe_pressure: { name: 'Resisting unsafe pressure', group: 'Dimension' },
    whistleblowing: { name: 'Whistleblowing', group: 'Dimension' },
    sharing_and_seeking_information: { name: 'Sharing and seeking information', group: 'Dimension' },
    emotional_intelligence: { name: 'Emotional intelligence', group: 'Dimension' },
    keeping_the_team_on_track: { name: 'Keeping the team on track', group: 'Dimension' },
    handling_conflict: { name: 'Handling conflict', group: 'Dimension' },
    taking_initiative: { name: 'Taking initiative', group: 'Dimension' },
    taking_over: { name: 'Taking over', group: 'Dimension' },
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const rows: LeaderboardRow[] = [];
    const d=JSON.parse(source);
    for (const r of d.models) {
      if (typeof r.score!=='number') continue;
      const metrics:Record<string,number>={public:r.public,private:r.private,baseline:r.baseline,alone:r.alone,
        strict:r.score_strict,teamworkLoss:r.teamwork_loss,gated:r.n_gated,scenarios:r.n_scenarios};
      for (const [key,v] of Object.entries(r.dims) as [string,Record<string,unknown>][]) {
        for (const [field,suffix] of [['test',''],['strict','Strict'],['alone','Alone'],['baseline','Baseline'],
          ['n_gated','Gated'],['n_complete','Complete'],['n_scenarios','Scenarios'],['n_refused','Refused']]) {
          const value=v[field];
          if (typeof value==='number') metrics[key+suffix]=value;
        }
      }
      rows.push({model:r.name,score:r.score,setting:`v${d.version}; ${r.high?"high":"minimum"} reasoning effort`,
        open:r.open,trials:r.runs,verified:r.status==='verified',low:r.ci?.[0],high:r.ci?.[1],metrics});
    }
    if (!rows.length) throw new Error("No collaborative-intelligence-benchmark score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

