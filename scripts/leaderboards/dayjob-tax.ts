// DAYJOB: Tax ranks agents by pass@1 at a 95% rubric threshold across 50 assignments.
import {fetchText} from '../lib/util.ts';
import {surgeRows,SURGE_TERMS,SURGE_ALIASES} from '../lib/boards/surgehq-cov2.ts';
const PAGE='https://surgehq.ai/benchmarks/dayjob-tax';
export default {benchmark:'dayjob-tax',url:PAGE,feed:PAGE,terms:SURGE_TERMS,aliases:SURGE_ALIASES,fetch:async()=>surgeRows(await fetchText(PAGE))};
