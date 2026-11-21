// SuperCLUE-SWE with Claude Code ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-swe-with-claude-code",
  url: "https://www.superclueai.com/specialized/CCSWE",
  feed: "https://www.superclueai.com/data/specialized_list/CCSWE/2026%E5%B9%B48%E6%9C%88.xlsx",
  roundFolder: "CCSWE",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 12,
  parts: ["平均每题运行时间（秒）", "平均每题交互轮数", "超时题目数量（在规定时间内未完成题目）", "总题目数量"],
  settings: ["使用方式"],
  metrics: {"costPerTaskCny": "平均每题价格(元)", "inputTokens": "平均每题输入tokens", "cachedTokens": "平均每题输入缓存命中tokens", "outputTokens": "平均每题输出tokens"},
});
