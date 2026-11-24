// SuperCLUE-DeepSWE ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-deepswe",
  url: "https://www.superclueai.com/specialized/DeepSWE",
  feed: "https://www.superclueai.com/data/specialized_list/DeepSWE/2026%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "DeepSWE",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 10,
  parts: [],
  settings: ["测评方式", "限时"],
  harness: "智能体框架",
  metrics: {"costPerTaskCny": "平均每题价格(元)", "latencyMinutes": "平均每题运行时间(分钟)", "inputTokens": "平均每题输入tokens", "cachedTokens": "平均每题输入缓存命中tokens", "outputTokens": "平均每题输出tokens", "timeouts": "超时题目数量", "totalTokens": "平均每题token消耗"},
});
