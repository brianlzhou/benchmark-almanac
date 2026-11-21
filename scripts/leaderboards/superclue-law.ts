// SuperCLUE-Law ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-law",
  url: "https://www.superclueai.com/specialized/Law",
  feed: "https://www.superclueai.com/data/specialized_list/Law/2026%E5%B9%B48%E6%9C%88.xlsx",
  roundFolder: "Law",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 11,
  parts: ["法律文本审核", "法律材料生成", "咨询交互服务", "法律知识记忆", "司法通行实操", "法律案件推理", "法律伦理安全"],
});
