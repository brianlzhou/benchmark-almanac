// The voice-v2 manifest identifies the current complete six-language, three-domain benchmark submissions. The published summary score is multiplied by 100. Domain and language scores remain metrics. The separate domain-extension manifest is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json";
const board: Leaderboard = {
  benchmark: "tau-bench-2-0",
  parts: {
    domain_airline: { name: 'Airline', group: 'Domain' },
    domain_retail: { name: 'Retail', group: 'Domain' },
    domain_telecom: { name: 'Telecom', group: 'Domain' },
    language_en: { name: 'English', group: 'Language' },
    language_es: { name: 'Spanish', group: 'Language' },
    language_pt: { name: 'Portuguese', group: 'Language' },
    language_hi: { name: 'Hindi', group: 'Language' },
    language_zh: { name: 'Chinese', group: 'Language' },
    language_ko: { name: 'Korean', group: 'Language' },
  },
  url: "https://sierra-tau-bench-public.s3.us-west-2.amazonaws.com/submissions/manifest.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const base=FEED.slice(0,FEED.lastIndexOf('/'));const manifest=await fetchJson<any>(FEED);const out:LeaderboardRow[]=[];
for(const id of manifest.voice_v2_submissions){await new Promise(r=>setTimeout(r,1100));const meta=await fetchJson<any>(`${base}/${id}/benchmark-metadata.json`);await new Promise(r=>setTimeout(r,1100));const d=await fetchJson<any>(`${base}/${id}/benchmark-submission.json`);if(d.frame.benchmark_version!=='voice-v2'||!d.summary.complete)throw new Error('Incomplete or wrong voice benchmark');
const metrics:Record<string,number>={};for(const [group,values] of Object.entries({language:d.summary.by_language,domain:d.summary.by_domain}) as any){for(const [k,v] of Object.entries(values) as any){if(typeof v.score==='number')metrics[`${group}_${k}`]=100*v.score;}}
for(const [source,key] of Object.entries({expected_trials:'expectedTrials',scored_trials:'scoredTrials',error_trials:'errorTrials',missing_trials:'missingTrials',unscored_trials:'unscoredTrials'})){
  if(typeof d.summary[source]==='number')metrics[key]=d.summary[source];
}
for(const cell of d.summary.cells ?? []){
  if(typeof cell.score!=='number')continue;
  const key=cell.language+cell.domain[0].toUpperCase()+cell.domain.slice(1);
  metrics[key]=100*cell.score;
  board.parts![key]={name:cell.domain,group:cell.language};
}
const effort=meta.notes.match(/at (high|medium|low) (?:reasoning|thinking)/i)?.[1]||meta.notes.match(/intelligence level: (high|medium|low)/i)?.[1];out.push({model:meta.model_name,submitter:meta.submitting_organization,agentOrg:meta.model_organization,link:`${base}/${id}/benchmark-submission.json`,trials:Array.isArray(d.frame.trials)?d.frame.trials.length:undefined,score:d.summary.score*100,date:meta.submission_date,harness:meta.agent_provider,setting:effort,metrics});}return out;

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
