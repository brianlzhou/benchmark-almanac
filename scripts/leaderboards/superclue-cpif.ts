// SuperCLUE-CPIF ranks entries by 总分 on its 按任务类型划分 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-cpif",
  url: "https://www.superclueai.com/specialized/CPIF",
  feed: "https://www.superclueai.com/data/specialized_list/CPIF/2025%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "CPIF",
  sheet: "按任务类型划分",
  model: "模型名称",
  score: "总分",
  minimum: 15,
  parts: ["语义约束", "结构约束", "量化约束", "复合约束", "组合约束"],
  details: [{"sheet": "按指令数量划分", "model": "模型名称", "parts": ["等级1", "等级2", "等级3", "等级4", "等级5"]}],
});
