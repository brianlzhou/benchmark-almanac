// SuperCLUE-OpenClaw ranks entries by 总成绩 on its 三次测评汇总 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-openclaw",
  url: "https://www.superclueai.com/openclaw/OpenClaw",
  feed: "https://www.superclueai.com/data/openclaw_list/OpenClaw/2026%E5%B9%B43%E6%9C%88.xlsx",
  roundFolder: "OpenClaw",
  sheet: "三次测评汇总",
  model: "模型名称",
  score: "总成绩",
  minimum: 9,
  parts: ["编码能力", "记忆能力", "内容创作", "数据处理", "研究分析", "平均耗时", "成本（元/百万Tokens）"],
  settings: ["使用方式"],
});
