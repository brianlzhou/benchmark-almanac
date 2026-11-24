// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// S-Eval measures model safety on Chinese and English base prompts. The official board also reports attack success rates.
// Attack success rates have the opposite direction and stay separate from the base safety score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsLiteral } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://s.alibaba.com/aisec/seval';
type Entry = { Model: string, TotalScore: number } & Record<string, string | number>;
const board: Leaderboard = {
  benchmark: 's-eval', url: feed + '/leaderboard', feed,
  aliases: { 'Mistral-Small-3.2-24B-Instruct-2506': 'mistral-small-3-2' },
  terms: 'S-Eval uses CC BY-NC-SA 4.0. https://creativecommons.org/licenses/by-nc-sa/4.0/',
  headline: 'The board reports each language separately, so this is the plain mean of Chinese and English base risk safety scores.',
  parts: {
    Chinese: { name: 'Chinese', unit: '%', better: 'higher' },
    'Chinese: 违法犯罪': { name: 'Chinese: 违法犯罪', unit: '%', better: 'higher' },
    'Chinese: 仇恨言论': { name: 'Chinese: 仇恨言论', unit: '%', better: 'higher' },
    'Chinese: 身心健康': { name: 'Chinese: 身心健康', unit: '%', better: 'higher' },
    'Chinese: 伦理道德': { name: 'Chinese: 伦理道德', unit: '%', better: 'higher' },
    'Chinese: 数据隐私': { name: 'Chinese: 数据隐私', unit: '%', better: 'higher' },
    'Chinese: 网络安全': { name: 'Chinese: 网络安全', unit: '%', better: 'higher' },
    'Chinese: 极端主义': { name: 'Chinese: 极端主义', unit: '%', better: 'higher' },
    'Chinese: 不当建议': { name: 'Chinese: 不当建议', unit: '%', better: 'higher' },
    English: { name: 'English', unit: '%', better: 'higher' },
    'English: Illegal Activities': { name: 'English: Illegal Activities', unit: '%', better: 'higher' },
    'English: Hate Speech': { name: 'English: Hate Speech', unit: '%', better: 'higher' },
    'English: Physical & Mental Health': { name: 'English: Physical & Mental Health', unit: '%', better: 'higher' },
    'English: Ethics & Morality': { name: 'English: Ethics & Morality', unit: '%', better: 'higher' },
    'English: Data Privacy': { name: 'English: Data Privacy', unit: '%', better: 'higher' },
    'English: Cybersecurity': { name: 'English: Cybersecurity', unit: '%', better: 'higher' },
    'English: Extremism': { name: 'English: Extremism', unit: '%', better: 'higher' },
    'English: Inappropriate Advice': { name: 'English: Inappropriate Advice', unit: '%', better: 'higher' },
    'Chinese attack success rate': { name: 'Chinese attack success rate', unit: '%', better: 'lower' },
    'Chinese attack success rate: 自适应攻击': { name: 'Chinese attack success rate: 自适应攻击', unit: '%', better: 'lower' },
    'Chinese attack success rate: 正面诱导': { name: 'Chinese attack success rate: 正面诱导', unit: '%', better: 'lower' },
    'Chinese attack success rate: 反面诱导': { name: 'Chinese attack success rate: 反面诱导', unit: '%', better: 'lower' },
    'Chinese attack success rate: 代码注入': { name: 'Chinese attack success rate: 代码注入', unit: '%', better: 'lower' },
    'Chinese attack success rate: 指令越狱': { name: 'Chinese attack success rate: 指令越狱', unit: '%', better: 'lower' },
    'Chinese attack success rate: 目标劫持': { name: 'Chinese attack success rate: 目标劫持', unit: '%', better: 'lower' },
    'Chinese attack success rate: 指令加密': { name: 'Chinese attack success rate: 指令加密', unit: '%', better: 'lower' },
    'Chinese attack success rate: 深度催眠': { name: 'Chinese attack success rate: 深度催眠', unit: '%', better: 'lower' },
    'Chinese attack success rate: 上下文攻击': { name: 'Chinese attack success rate: 上下文攻击', unit: '%', better: 'lower' },
    'Chinese attack success rate: 话语链': { name: 'Chinese attack success rate: 话语链', unit: '%', better: 'lower' },
    'Chinese attack success rate: 组合指令攻击': { name: 'Chinese attack success rate: 组合指令攻击', unit: '%', better: 'lower' },
    'English attack success rate': { name: 'English attack success rate', unit: '%', better: 'lower' },
    'English attack success rate: Adaptive Attack': { name: 'English attack success rate: Adaptive Attack', unit: '%', better: 'lower' },
    'English attack success rate: Positive Induction': { name: 'English attack success rate: Positive Induction', unit: '%', better: 'lower' },
    'English attack success rate: Reverse Induction': { name: 'English attack success rate: Reverse Induction', unit: '%', better: 'lower' },
    'English attack success rate: Code Injection': { name: 'English attack success rate: Code Injection', unit: '%', better: 'lower' },
    'English attack success rate: Instruction Jailbreak': { name: 'English attack success rate: Instruction Jailbreak', unit: '%', better: 'lower' },
    'English attack success rate: Goal Hijacking': { name: 'English attack success rate: Goal Hijacking', unit: '%', better: 'lower' },
    'English attack success rate: Instruction Encryption': { name: 'English attack success rate: Instruction Encryption', unit: '%', better: 'lower' },
    'English attack success rate: DeepInception': { name: 'English attack success rate: DeepInception', unit: '%', better: 'lower' },
    'English attack success rate: In-Context Attack': { name: 'English attack success rate: In-Context Attack', unit: '%', better: 'lower' },
    'English attack success rate: Chain of Utterances': { name: 'English attack success rate: Chain of Utterances', unit: '%', better: 'lower' },
    'English attack success rate: Compositional Instruction Attack': { name: 'English attack success rate: Compositional Instruction Attack', unit: '%', better: 'lower' },
  },
  async fetch() {
    const page = await fetchText(feed);
    const asset = page.match(/<script\b[^>]*\bsrc="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!asset) throw Error('Missing S-Eval leaderboard bundle');
    const bundle = (await fetchText(new URL(asset, feed).href)).replace(/:\.(\d+)/g, ':0.$1');
    function group(key: string) {
      const match = new RegExp('\\b' + key + ':[$\\w]+\\(\\[').exec(bundle);
      if (!match) throw Error('Missing S-Eval board: ' + key);
      const entries = jsLiteral<Entry[]>(bundle, match.index + match[0].length - 1);
      const byModel = new Map(entries.map(row => [row.Model, row]));
      if (!entries.length || byModel.size !== entries.length || entries.some(row => !row.Model || !Number.isFinite(row.TotalScore)))
        throw Error('Invalid model rows: ' + key);
      return byModel;
    }
    const zh = group('base_risk_zh'), en = group('base_risk_en');
    const zhAttack = group('attack_zh'), enAttack = group('attack_en');
    const rows: LeaderboardRow[] = [];
    for (const [model, chinese] of zh) {
      const english = en.get(model);
      if (!english) continue;
      const metrics: Record<string, number> = {};
      function record(entry: Entry, label: string) {
        for (const [name, value] of Object.entries(entry)) {
          if (typeof value !== 'number') continue;
          const key = name === 'TotalScore' ? label : label + ': ' + name;
          metrics[key] = value;
        }
      }
      record(chinese, 'Chinese');
      record(english, 'English');
      if (zhAttack.has(model)) record(zhAttack.get(model)!, 'Chinese attack success rate');
      if (enAttack.has(model)) record(enAttack.get(model)!, 'English attack success rate');
      rows.push({ model, score: (chinese.TotalScore + english.TotalScore) / 2, metrics });
    }
    return checked(rows, 38);
  },
};
export default board;
