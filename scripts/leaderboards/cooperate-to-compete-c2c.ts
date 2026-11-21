// Figure 1c of the authors' paper prints the same seven coefficients as the project page.
import type { Leaderboard } from './types.ts'
import { fetchText } from '../lib/util.ts'

const PAGE = 'https://arxiv.org/html/2604.25088v1#S1.F1'
const FIGURE = 'https://arxiv.org/html/2604.25088v1/main_c.svg'

const board: Leaderboard = {
  benchmark: 'cooperate-to-compete-c2c', static: 'paper',
  url: PAGE,
  feed: FIGURE,
  terms: 'The Almanac credits the authors and links their published figure.',
  aliases: { 'Gemini 3.1 Flash Lite': 'gemini-3-1-flash-lite' },
  async fetch() {
    const svg = await fetchText(FIGURE)
    // arXiv stores each printed character with its baseline. Join characters on the same line.
    const lines = new Map<number, string>()
    for (const m of svg.matchAll(/<use data-text="([^"]*)"[^>]*?transform="matrix\([^)]*,([\d.]+)\)"/g)) {
      const y = Number(m[2])
      lines.set(y, (lines.get(y) ?? '') + m[1])
    }
    if (![...lines.values()].includes('Player Strength (Plackett-Luce Coefficients)')) throw new Error('C2C figure changed')
    const scores = [...lines].filter(([, value]) => /^-?\d+\.\d{3}$/.test(value)).sort(([a], [b]) => a - b)
    if (scores.length !== 7) throw new Error('Expected seven printed coefficients in C2C Figure 1c')
    // The row labels can wrap. Pair their lines with the score between the neighboring row midpoints.
    return scores.map(([y, value], i) => {
      const top = (y + (scores[i - 1]?.[0] ?? 2 * y - scores[1][0])) / 2
      const bottom = (y + (scores[i + 1]?.[0] ?? 2 * y - scores[i - 1][0])) / 2
      const label = [...lines].filter(([line, s]) => line > top && line < bottom && line !== y && /[a-z]/i.test(s))
        .sort(([a], [b]) => a - b).map(([, s]) => s).join(' ')
      if (!label) throw new Error('C2C coefficient has no player label')
      const [, model, setting] = label.match(/^(.+?)(?: \((non-reasoning|reasoning)\))?$/)!
      return { model, setting, score: Number(value) }
    })
  },
}
export default board
