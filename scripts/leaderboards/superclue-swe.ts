// SuperCLUE-SWE ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-swe",
  url: "https://www.superclueai.com/specialized/SWE",
  feed: "https://www.superclueai.com/data/specialized_list/SWE/2026%E5%B9%B45%E6%9C%88.xlsx",
  roundFolder: "SWE",
  sheet: "总榜",
  model: "模型",
  score: "总分",
  minimum: 17,
  parts: ["完成数", "完成率", "异常数", "异常率", "空补丁数", "空补丁率", "解决数", "转化率", "解决率"],
});
