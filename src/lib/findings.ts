// Headlines that state what the data shows, written from the numbers at build time.
import type { BenchSummary, ModelSummary } from './data.ts';
import { benchById, modelById, SATURATED } from './data.ts';
import { longMonthYear, score } from './format.ts';
import { RANKED_BY_PEOPLE_OR_MATCHES } from './taxonomy.ts';

const name = (id: string) => modelById.get(id)?.name ?? id;

export function leaderLine(s: BenchSummary, testedUntil?: string): string {
  const top = s.best;
  if (!top) return 'No scores yet';
  // An arena rating only ranks a model against others rated in the same arena at the same time, so ratings
  // quoted in labs' own posts never name a leader.
  if ((s.shownSource === 'card' || s.shownSource === 'claim') && RANKED_BY_PEOPLE_OR_MATCHES.has(s.b.scoring ?? '')) {
    const n = new Set(s.shown.map((x) => x.model)).size;
    return n === 1 ? `Only ${name(top.model)} has a rating here, from its lab’s own post` : `${n} models have ratings here, all from their labs’ own posts`;
  }
  const tie = s.board.filter((x) => x.value === top.value).length;
  const v = score(top.value, s.b.unit ?? '%');
  const lead = tie > 1 ? `${tie} models share the top score of ${v}` : `${name(top.model)} leads with ${v}`;
  return testedUntil ? `${lead} among models released by ${longMonthYear(testedUntil)}` : lead;
}

export function lifeLine(s: BenchSummary): string {
  switch (s.status) {
    case 'in use': {
      const recent = new Set(s.cites.filter((c) => monthsAgo(c.card.date) < 6).map((c) => c.card.lab)).size;
      return recent > 1 ? `${recent} labs put it in a launch post in the last six months` : recent === 1 ? 'One lab put it in a launch post in the last six months' : 'New this year';
    }
    case 'fading':
      return `Labs headline it less often now, last in ${longMonthYear(s.last)}`;
    case 'dropped':
      if (s.why === 'saturated') return `Labs dropped it from launch posts once the best score passed ${SATURATED}%`;
      if (s.why === 'replaced' && s.b.successor) return `Labs moved on to ${benchById.get(s.b.successor)?.name}`;
      return `No launch post has listed it since ${longMonthYear(s.last)}`;
    case 'system cards':
      return 'Labs report it only in system cards';
    default:
      return 'No lab model card reports it yet';
  }
}

let asOf = '';
export function setAsOf(d: string) {
  asOf = d;
}
function monthsAgo(d: string) {
  const [ay, am] = d.split('-').map(Number);
  const [by, bm] = asOf.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function modelLine(m: ModelSummary): string {
  const firsts = m.results.filter((r) => r.rank === 1 && r.of >= 5);
  const n = m.m.name;
  // the count is of benchmarks with five or more models scored, the same ones a first place counts on
  if (firsts.length >= 2) return `${n} ranks first on ${firsts.length} of the ${m.results.filter((r) => r.of >= 5).length} benchmarks with five or more models scored`;
  if (firsts.length === 1) return `${n} ranks first on ${firsts[0].benchmark.name}`;
  if (m.eciRank && m.eciRank <= 10) return `${n} is number ${m.eciRank} on the Epoch Capabilities Index`;
  const top3 = m.results.filter((r) => r.rank <= 3 && r.of >= 5);
  if (top3.length) return `${n} places in the top three on ${top3.length === 1 ? top3[0].benchmark.name : `${top3.length} benchmarks`}`;
  return n;
}
