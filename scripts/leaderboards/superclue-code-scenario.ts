// SuperCLUE-Code Scenario ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-code-scenario",
  url: "https://www.superclueai.com/specialized/CodeScenario",
  feed: "https://www.superclueai.com/data/specialized_list/CodeScenario/2026%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "CodeScenario",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 6,
  parts: ["平均每题运行时间(秒)"],
});
