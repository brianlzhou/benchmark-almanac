// Apollo tests whether a simulated trader acts on insider information.
// The score is the percentage of 300 trials labeled misaligned. Later stages
// measure deception among misaligned trials and doubling down among deceptive trials.
// Read the makers' labeled JSON completions in one archive request.
import { execFileSync } from 'node:child_process';
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/ApolloResearch/insider-trading';
const feed = 'https://codeload.github.com/ApolloResearch/insider-trading/zip/refs/heads/main';
const summarize = `
from collections import Counter, defaultdict
import io, json, sys, zipfile
fields = {'misalignment': 'is_misaligned', 'deception': 'is_deceptive', 'doubling_down': 'is_doubling_down'}
runs = defaultdict(lambda: defaultdict(Counter))
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as source:
    for name in source.namelist():
        path = name.split('/')
        if len(path) < 6 or path[1] != 'results' or not path[-1].endswith('.json'):
            continue
        experiment, stage = path[2], path[-2]
        setting = ': '.join([experiment.replace('_', ' '), *path[4:-2]])
        result = json.loads(source.read(name))
        value = result[fields[stage]]
        if not isinstance(value, bool):
            raise ValueError('Missing outcome in ' + name)
        runs[result['model'], setting][stage][value] += 1
rows = []
for (model, setting), stages in runs.items():
    initial = stages['misalignment']
    total = sum(initial.values())
    if total != 300:
        raise ValueError('Incomplete initial trials')
    metrics = {}
    expected = initial[True]
    for stage in ['deception', 'doubling_down']:
        counts = stages.get(stage)
        if counts is None:
            if expected and (stage == 'deception' or setting == 'default'):
                raise ValueError('Missing conditional trials')
            break
        if sum(counts.values()) != expected or not expected:
            raise ValueError('Inconsistent conditional trials')
        metrics[stage] = counts[True] * 100 / expected
        expected = counts[True]
    rows.append(dict(model=model, setting=setting, trials=total, score=100*initial[True]/total, metrics=metrics))
print(json.dumps(rows))
`;
export default {
  benchmark: 'insider-trading-apollo', url, feed,
  terms: 'CC BY 4.0 at https://github.com/ApolloResearch/insider-trading/blob/main/LICENSE',
  aliases: {'gpt-4-0613': 'gpt-4-jun-2023', 'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023',
    'gpt-3.5-turbo-instruct-0914': 'gpt-3-5-turbo-instruct', 'text-davinci-003': 'davinci-003'},
  parts: {deception: {name: 'Strategic deception given misalignment', unit: '%', better: 'lower'},
    doubling_down: {name: 'Doubling down given deception', unit: '%', better: 'lower'}},
  async fetch() {
    const input = Buffer.from(await fetchBytes(feed));
    const rows: LeaderboardRow[] = JSON.parse(execFileSync('python3', ['-c', summarize], {input, encoding: 'utf8'}));
    return checked(rows, 32);
  },
} satisfies Leaderboard;
