// Tests for reading benchmark names from model cards: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardNames } from './labs.ts';

test('a card cell with a capability label and a benchmark name gives only the name', () => {
  // the Qwen3.8 cards of 2026-11-07 put "Agentic coding" above "SWE-bench Pro" in one cell
  const card =
    '<tr><td class="benchmark-cell"><div class="benchmark-capability" style="font-weight:600">Agentic coding</div><div class="benchmark-name" style="font-size:11px">SWE-bench Pro</div></td><td>62.5</td></tr>';
  assert.deepEqual(cardNames(card), ['SWE-bench Pro']);
});

test('the tables under a training heading are not evaluations', () => {
  // the Nemotron 3.5 Bolt card of 2026-11-07 lists its RL environments under "### Training"
  const card = [
    '## Benchmarks',
    '| Benchmark | Score |',
    '| SWE-bench Verified | 80.1 |',
    '## Training, Testing, and Evaluation Datasets',
    '### Training',
    '#### Post-Training',
    '| ARC-AGI Gym Environment | Text | Undisclosed |',
    '| [SWE-Gym](https://huggingface.co/datasets/SWE-Gym/SWE-Gym) | 10/2/2025 |',
    '## Evaluation Datasets',
    '| LiveCodeBench | Text |',
  ].join('\n');
  assert.deepEqual(cardNames(card).filter((n) => !/^(Benchmark|Score|Text)$/.test(n)), ['SWE-bench Verified', 'LiveCodeBench']);
});

test('a metric after a known name gives the name', () => {
  assert.deepEqual(cardNames('| Claw-Eval Avg | 61.0 |\n| SkillsBench Avg5 | 40.2 |'), ['Claw-Eval', 'SkillsBench']);
});
