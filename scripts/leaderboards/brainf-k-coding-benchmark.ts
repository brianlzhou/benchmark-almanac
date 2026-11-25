// Brainf**k coding benchmark (Kaggle Benchmarks, by pedroschoen): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'brainf-k-coding-benchmark',
  url: 'https://www.kaggle.com/benchmarks/pedroschoen/brainfk-coding-benchmark',
  feed: kaggleFeed('pedroschoen', 'brainfk-coding-benchmark'),
  terms: KAGGLE_TERMS,
  parts: {
    copyStdin: 'Copy stdin to stdout',
    addTwoDigits: 'Add two digits',
    helloWorld: 'Hello, World!',
    printOk: 'Print OK',
    echoOneByte: 'Echo one byte',
    print1To9: 'Print 1 to 9',
    uppercase: 'Uppercase',
    reverseString: 'Reverse a string',
    countChars: 'Count characters',
    primalityTest: 'Primality test',
    countdown: 'Countdown',
    sumOfDigits: 'Sum of digits',
    decimalToBinary: 'Decimal to binary',
    sortThreeDigits: 'Sort three digits',
    fizzBuzz: 'FizzBuzz',
  },
  fetch: () => kaggleRowsWithBounds('pedroschoen', 'brainfk-coding-benchmark', "(Overall)", 100, {
    copyStdin: { task: 'brainf**k: Copy stdin to stdout', scale: 100 },
    addTwoDigits: { task: 'brainf**k: Add two digits', scale: 100 },
    helloWorld: { task: 'brainf**k: Hello, World!', scale: 100 },
    printOk: { task: 'brainf**k: Print OK', scale: 100 },
    echoOneByte: { task: 'brainf**k: Echo one byte', scale: 100 },
    print1To9: { task: 'brainf**k: Print 1 to 9', scale: 100 },
    uppercase: { task: 'brainf**k: Uppercase', scale: 100 },
    reverseString: { task: 'brainf**k: Reverse a string', scale: 100 },
    countChars: { task: 'brainf**k: Count characters', scale: 100 },
    primalityTest: { task: 'brainf**k: Primality test', scale: 100 },
    countdown: { task: 'brainf**k: Countdown', scale: 100 },
    sumOfDigits: { task: 'brainf**k: Sum of digits', scale: 100 },
    decimalToBinary: { task: 'brainf**k: Decimal to binary', scale: 100 },
    sortThreeDigits: { task: 'brainf**k: Sort three digits', scale: 100 },
    fizzBuzz: { task: 'brainf**k: FizzBuzz', scale: 100 },
  }),
};
export default board;
