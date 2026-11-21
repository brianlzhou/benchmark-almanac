// SuperCLUE-XClaw ranks entries by 总成绩 on its 三次结果汇总 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-xclaw",
  url: "https://www.superclueai.com/openclaw/XClaw",
  feed: "https://www.superclueai.com/data/openclaw_list/XClaw/2026%E5%B9%B48%E6%9C%88.xlsx",
  roundFolder: "XClaw",
  sheet: "三次结果汇总",
  model: "底层模型",
  score: "总成绩",
  minimum: 10,
  trials: 3,
  metrics: { run1: "第一次测评总分", run2: "第二次测评总分", run3: "第三次测评总分" },
  parts: ["代码开发", "内容创作", "数据处理", "研究分析", "记忆能力"],
  settings: ["部署方式", "答案获取途径"],
  harness: "产品名称",
});
