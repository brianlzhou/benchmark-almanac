// AgentCLUE tests how models use tools in multi-turn conversations.
// SuperCLUE ranks the models by 总分 and publishes the task scores in the same workbook.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes, fetchText } from '../lib/util.ts';
import { readXlsx, SC_ALIASES, SC_SITE, SC_TERMS } from './superclue.ts';

interface WorkbookBoard {
  benchmark: string;
  url: string;
  feed: string;
  sheet: string;
  model: string;
  score: string;
  minimum: number;
  parts: string[];
  settings?: string[];
  aliases?: Record<string, string>;
  scale?: number;
  details?: { sheet: string; model: string; parts: string[] }[];
  roundFolder?: string;
  harness?: string;
  fixedHarness?: string;
  trials?: number;
  metrics?: Record<string, string>;
  percentages?: string[];
}

function numberCell(value: string): number | undefined {
  if (!value || /^(?:[-—/]+|N\/A|暂无)$/i.test(value)) return undefined;
  const numeric = Number(value.replace(/(?:%|级)$/, ''));
  if (!Number.isFinite(numeric)) throw new Error(`Invalid numeric cell: ${value}`);
  return numeric;
}

function publicationDate(value: string, feed: string): string | undefined {
  const match = /^(20\d\d)\D+(\d{1,2})\D+(\d{1,2})/.exec(value);
  if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const partial = /^(\d{1,2})\.(\d{2})$/.exec(value);
  const year = decodeURI(feed).match(/\/(20\d\d)年/)?.[1];
  if (partial && year) return `${year}-${partial[1].padStart(2, '0')}-${partial[2]}`;
  if (/^4\d{4}$/.test(value)) return new Date((Number(value) - 25569) * 86400000).toISOString().slice(0, 10);
}

// The app lists the newest workbook first for each board folder.
let roundMap: Promise<string> | undefined;
const pause = () => new Promise(resolve => setTimeout(resolve, 1000));
async function currentWorkbook(feed: string, roundFolder: string): Promise<string> {
  roundMap ??= (async () => {
    const page = await fetchText(SC_SITE);
    const entry = page.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!entry) throw new Error('SuperCLUE: missing app script');
    await pause();
    const chunk = (await fetchText(SC_SITE + entry)).match(/visualization-utils-[\w-]+\.js/)?.[0];
    if (!chunk) throw new Error('SuperCLUE: missing workbook index');
    await pause();
    return fetchText(SC_SITE + '/assets/' + chunk);
  })();
  const index = await roundMap;
  const escaped = roundFolder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const round = index.match(new RegExp('[,{]"?' + escaped + '"?:\\["([^"]+)"'))?.[1];
  if (!round) throw new Error('SuperCLUE: missing workbook round for ' + roundFolder);
  await pause();
  return new URL(encodeURIComponent(round) + '.xlsx', feed).href;
}

/** Read a SuperCLUE results sheet using the board's own column names. */
export async function loadWorkbook(feed: string, folder?: string) {
  const current = folder ? await currentWorkbook(feed, folder) : feed;
  return { feed: current, sheets: readXlsx(Buffer.from(await fetchBytes(current))) };
}

export function workbookBoard(config: WorkbookBoard, load = loadWorkbook): Leaderboard {
  const { benchmark, url, feed } = config;
  const parts: NonNullable<Leaderboard['parts']> = {};
  const counters: Record<string, string> = {
    '平均每题耗时(秒)': 'latency', '平均每题运行时间(秒)': 'latency',
    '平均每题成本(元)': 'costPerTaskCny', '平均每题价格(元)': 'costPerTaskCny',
    '基础检索能力平均耗时(秒/题)': 'retrievalLatency', '分析推理能力平均耗时(秒/题)': 'reasoningLatency',
    '生成视频数': 'generatedVideos', '有效评测数': 'validEvaluations', '评测完成率(%)': 'completionRate',
    '完整回复率(%)': 'completeResponseRate', '截断率(%)': 'truncationRate', '无回复率(%)': 'noResponseRate',
    '平均每题token消耗': 'totalTokens', '平均每题步数': 'steps',
  };
  let otherCount = 0;
  const fields = (names: string[], group?: string) => names.map(name => {
    const metric = counters[name.normalize('NFKC').replace(/\s/g, '')];
    if (metric) return [metric, name] as const;
    if (name.endsWith('回复率')) return [`responseRate${++otherCount}`, name] as const;
    const key = `part${Object.keys(parts).length + 1}`;
    parts[key] = { name, group, ...(name.endsWith('↓') ? { better: 'lower', unit: '%' } : {}), ...(config.percentages?.includes(name) ? { unit: '%' } : {}) };
    return [key, name] as const;
  });
  const main = fields(config.parts);
  const details = (config.details ?? []).map(detail => ({ ...detail, fields: fields(detail.parts, detail.sheet) }));
  return {
    benchmark, url, feed, parts, terms: SC_TERMS,
    ...(config.harness ? { harnesses: 'system' } : {}),
    ...(config.fixedHarness ? { reference: [config.fixedHarness] } : {}),
    aliases: { ...SC_ALIASES, ...config.aliases },
    async fetch() {
      const { sheets, feed: current } = await load(feed, config.roundFolder);
      const table = sheets.get(config.sheet);
      if (!table) throw new Error(`${benchmark}: missing sheet ${config.sheet}`);
      const headIndex = table.findIndex(row => row.includes(config.model) && row.includes(config.score));
      if (headIndex < 0) throw new Error(`${benchmark}: missing model or score column`);
      const headers = table[headIndex];
      for (const field of [...config.parts, ...(config.settings ?? []), ...Object.values(config.metrics ?? {}), ...(config.harness ? [config.harness] : [])]) {
        if (!headers.includes(field)) throw new Error(`${benchmark}: missing ${field}`);
      }
      const rows: LeaderboardRow[] = [];
      for (const cells of table.slice(headIndex + 1)) {
        const get = (field: string) => cells[headers.indexOf(field)]?.trim() ?? '';
        const model = get(config.model);
        if (!model) continue;
        const score = numberCell(get(config.score));
        if (score === undefined) continue;
        const settings = (config.settings ?? []).map(get).filter(value => value && value !== '-');
        const row: LeaderboardRow = { model, score: score * (config.scale ?? 1) };
        if (config.trials) row.trials = config.trials;
        if (config.fixedHarness) row.harness = config.fixedHarness;
        if (config.harness) {
          row.harness = get(config.harness);
          if (config.model === '底层模型' && /^(Auto|默认|未知|未披露|未公开|-)$/.test(model)) row.model = row.harness;
          if (config.harness === '产品' || config.harness === '产品名称') row.agentOrg = get('机构') || undefined;
        }
        const effort = model.match(/[（(](max|high|medium|low|thinking|non-thinking)[）)]$/i)?.[1];
        if (effort && !settings.includes(effort)) settings.unshift(effort);
        if (settings.length) row.setting = settings.join(' / ');
        const date = publicationDate(get('评测日期') || get('测评日期') || get('测评发布日期') || get('发布日期'), current);
        if (date) row.date = date;
        for (const [key, field] of [...main, ...Object.entries(config.metrics ?? {})]) {
          const cell = get(field);
          const range = key === 'costPerTaskCny' && /^(\d+(?:\.\d+)?)\s*[~～–-]\s*(\d+(?:\.\d+)?)$/.exec(cell);
          if (range) {
            (row.metrics ??= {}).costPerTaskCnyLow = Number(range[1]);
            row.metrics.costPerTaskCnyHigh = Number(range[2]);
            continue;
          }
          const value = numberCell(cell);
          if (value !== undefined) (row.metrics ??= {})[key] = value * (config.percentages?.includes(field) ? 100 : config.scale ?? 1);
        }
        const openness = get('是否开源') || get('开闭源') || get('开/闭源');
        if (/^(开源|闭源|是|否)$/.test(openness)) row.open = openness === '开源' || openness === '是';
        if (row.metrics?.outputTokens !== undefined) {
          row.tokens = row.metrics.outputTokens;
          delete row.metrics.outputTokens;
        }
        if (row.metrics?.latencyMinutes !== undefined) {
          row.metrics.latency = row.metrics.latencyMinutes * 60;
          delete row.metrics.latencyMinutes;
        }
        rows.push(row);
      }
      for (const detail of details) {
        const table = sheets.get(detail.sheet);
        const start = table?.findIndex(cells => cells.includes(detail.model)) ?? -1;
        if (!table || start < 0) throw new Error(`${benchmark}: missing ${detail.sheet} model column`);
        const head = table[start];
        for (const field of detail.parts) {
          if (!head.includes(field)) throw new Error(`${detail.sheet}: missing ${field}`);
        }
        for (const cells of table.slice(start + 1)) {
          const model = cells[head.indexOf(detail.model)]?.trim();
          if (!model) continue;
          for (const row of rows.filter(row => row.model === model)) {
            for (const [key, field] of detail.fields) {
              const value = numberCell(cells[head.indexOf(field)]?.trim() ?? '');
              if (value !== undefined) (row.metrics ??= {})[key] = value * (config.percentages?.includes(field) ? 100 : config.scale ?? 1);
            }
            if (head.includes('手机型号') || head.includes('版本号')) {
              const settings = [row.setting, ...['手机型号', '使用方式', '版本号'].map(field => cells[head.indexOf(field)])];
              row.setting = [...new Set(settings.filter(value => value && value !== '-'))].join(' / ');
            }
            const openness = cells[head.indexOf('是否开源')];
            if (/^(开源|闭源|是|否)$/.test(openness)) row.open = openness === '开源' || openness === '是';
            const size = cells[head.indexOf('参数量')] || cells[head.indexOf('开源模型参数量')];
            if (/^\d+(?:\.\d+)?B$/i.test(size ?? '')) row.params = Number(size.slice(0, -1));
          }
        }
      }
      if (rows.length < config.minimum) throw new Error(`${benchmark}: expected at least ${config.minimum} rows, found ${rows.length}`);
      return rows;
    },
  };
}

export default workbookBoard({
  benchmark: 'agentclue',
  url: 'https://www.superclueai.com/agent/AgentCLUE',
  feed: 'https://www.superclueai.com/data/agent_list/AgentCLUE/2025%E5%B9%B42%E6%9C%88.xlsx',
  roundFolder: 'AgentCLUE',
  sheet: '总榜',
  model: '模型',
  score: '总分',
  minimum: 12,
  parts: ['常规多轮对话', '函数缺失', '参数缺失', '长上下文干扰'],
  settings: ['使用方式'],
  aliases: {
    'Claude-3.5-Sonnet(1022)': 'claude-3-5-sonnet-october-2024',
    'Doubao-1.5-pro-32k-250115': 'doubao-1-5-pro',
    'Qwen-2.5-72B-Chat': 'qwen2-5-72b',
    'Qwen-2.5-7B-Chat': 'qwen2-5-7b',
    'Llama-3.1-8B-Instruct': 'llama-3-1-8b',
  },
});
